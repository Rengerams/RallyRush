from collections import deque
from fastapi import FastAPI, APIRouter, Query, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import os
import re
import logging
import time
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, field_validator, model_validator
from typing import List, Literal, Optional, Annotated
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]
DIFF_POINTS = {"easy": 10, "medium": 20, "hard": 35, "pro": 60}
MATCH_POST_WINDOW_SECONDS = 60
MATCH_POST_LIMIT = 60
_match_submission_events: dict[str, deque[float]] = {}


def _allow_match_submission(client_key: str, now: Optional[float] = None) -> bool:
    """Best-effort per-process burst limit; use shared storage for multi-worker enforcement."""
    now = time.monotonic() if now is None else now
    events = _match_submission_events.setdefault(client_key, deque())
    while events and now - events[0] >= MATCH_POST_WINDOW_SECONDS:
        events.popleft()
    if len(events) >= MATCH_POST_LIMIT:
        return False
    events.append(now)
    if len(_match_submission_events) > 4096:
        for key, bucket in list(_match_submission_events.items()):
            while bucket and now - bucket[0] >= MATCH_POST_WINDOW_SECONDS:
                bucket.popleft()
            if not bucket:
                _match_submission_events.pop(key, None)
    return True


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude={"id"})
        return data

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)


class MatchStats(BaseModel):
    # Bound client-supplied counters to non-negative, plausible integers.
    aces: int = Field(default=0, ge=0, le=100_000)
    double_faults: int = Field(default=0, ge=0, le=100_000)
    winners: int = Field(default=0, ge=0, le=100_000)
    errors: int = Field(default=0, ge=0, le=100_000)
    perfect_shots: int = Field(default=0, ge=0, le=100_000)
    total_shots: int = Field(default=0, ge=0, le=100_000)
    longest_rally: int = Field(default=0, ge=0, le=100_000)
    points_won: int = Field(default=0, ge=0, le=100_000)


class MatchIn(BaseModel):
    # Optional stable identifier makes retries safe and supports legacy match records.
    match_id: Optional[str] = Field(default=None, min_length=8, max_length=96,
                                    pattern=r"^[a-zA-Z0-9_-]+$")
    player_name: str = Field(min_length=1, max_length=24)
    won: bool
    difficulty: Literal["easy", "medium", "hard", "pro"]
    ai_style: Literal["baseline", "netrusher", "defensive", "aggressive"]
    surface: Literal["hard", "clay", "grass", "artificial", "smashcourt"]
    match_format: Literal["quick", "standard"]
    sets: List[List[Annotated[int, Field(ge=0, le=99)]]] = Field(max_length=3)
    duration_sec: int = Field(default=0, ge=0, le=86_400)
    legend: bool = False
    stats: MatchStats
    opponent_points: int = Field(default=0, ge=0, le=100_000)
    opponent_stats: Optional[MatchStats] = None
    rally_lengths: List[Annotated[int, Field(ge=0)]] = Field(default_factory=list, max_length=5000)

    @field_validator("player_name")
    @classmethod
    def normalize_player_name(cls, value: str) -> str:
        name = " ".join(value.split())
        if not name:
            raise ValueError("player_name must contain a visible character")
        return name

    @model_validator(mode="after")
    def validate_completed_set_scores(self):
        required_sets = 1 if self.match_format == "quick" else 2
        max_sets = 1 if self.match_format == "quick" else 3
        games_to_win = 3 if self.match_format == "quick" else 6
        if not required_sets <= len(self.sets) <= max_sets:
            raise ValueError("sets must contain a completed match result for the selected format")
        for score in self.sets:
            if len(score) != 2:
                raise ValueError("each completed set must have two game totals")
            a, b = score
            high, low = max(a, b), min(a, b)
            # A level score at the format's game target represents a recorded tie-break.
            if (a, b) == (games_to_win, games_to_win):
                continue
            if high < games_to_win or high > games_to_win + 1 or high - low < 2:
                raise ValueError("set score does not describe a completed tennis set")
            if high == games_to_win + 1 and low != games_to_win - 1:
                raise ValueError("set score is not reachable under the selected format")
        return self


class Match(BaseDocument, MatchIn):
    rating_points: int = 0
    created_at: str


@api_router.get("/")
async def root():
    return {"message": "RENFFR OPEN Tennis API"}


@api_router.post("/matches", response_model=Match, response_model_by_alias=False)
async def create_match(body: MatchIn, request: Request):
    client_key = request.client.host if request.client else "unknown"
    if not _allow_match_submission(client_key):
        raise HTTPException(status_code=429, detail="Too many match submissions; try again shortly")
    name = body.player_name.strip()
    rating = DIFF_POINTS[body.difficulty] if body.won else 2
    match = Match(**body.model_dump(exclude={"player_name"}), player_name=name,
                  rating_points=rating, created_at=datetime.now(timezone.utc).isoformat())
    if body.match_id:
        # Atomic insert-once: a timed-out HTTP response can be retried without
        # inflating the leaderboard with the same completed match.
        try:
            await db.matches.update_one(
                {"match_id": body.match_id},
                {"$setOnInsert": match.to_mongo()},
                upsert=True,
            )
        except DuplicateKeyError:
            # Simultaneous retries may race on the unique partial index.
            pass
        saved = await db.matches.find_one({"match_id": body.match_id})
        return Match.from_mongo(saved)
    res = await db.matches.insert_one(match.to_mongo())
    match.id = str(res.inserted_id)
    return match


@api_router.get("/matches", response_model=List[Match], response_model_by_alias=False)
async def list_matches(player: Optional[str] = None, surface: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    q = {}
    if player:
        q["player_name"] = {"$regex": f"^{re.escape(player.strip())}$", "$options": "i"}
    if surface:
        q["surface"] = surface
    docs = await db.matches.find(q).sort("created_at", -1).to_list(limit)
    return [Match.from_mongo(d) for d in docs]


class LeaderRow(BaseModel):
    player_name: str
    matches: int
    wins: int
    losses: int
    win_pct: float
    rating: int
    best_rally: int
    aces: int
    perfect_shots: int
    legend: bool


@api_router.get("/leaderboard", response_model=List[LeaderRow])
async def leaderboard(mode: Literal["competitive", "legend"] = "competitive", limit: int = Query(50, ge=1, le=200)):
    # Keep boosted Legend matches out of competitive rankings while retaining
    # a separate view for those matches. $ne also includes older rows without
    # an explicit legend field.
    match_filter = {"legend": True} if mode == "legend" else {"legend": {"$ne": True}}
    pipeline = [
        {"$match": match_filter},
        {"$group": {
            "_id": {"$toLower": "$player_name"},
            "player_name": {"$first": "$player_name"},
            "matches": {"$sum": 1},
            "wins": {"$sum": {"$cond": ["$won", 1, 0]}},
            "rating": {"$sum": "$rating_points"},
            "best_rally": {"$max": "$stats.longest_rally"},
            "aces": {"$sum": "$stats.aces"},
            "perfect_shots": {"$sum": "$stats.perfect_shots"},
            "legend": {"$max": "$legend"},
        }},
        {"$sort": {"rating": -1, "wins": -1}},
        {"$limit": limit},
    ]
    rows = await db.matches.aggregate(pipeline).to_list(limit)
    return [LeaderRow(
        player_name=r["player_name"], matches=r["matches"], wins=r["wins"], losses=r["matches"] - r["wins"],
        win_pct=round(100 * r["wins"] / r["matches"], 1), rating=r["rating"], best_rally=r["best_rally"] or 0,
        aces=r["aces"], perfect_shots=r["perfect_shots"], legend=bool(r["legend"]),
    ) for r in rows]


@app.on_event("startup")
async def ensure_match_indexes():
    # Legacy rows omit match_id; index only new rows with a string identifier.
    await db.matches.create_index(
        "match_id", unique=True,
        partialFilterExpression={"match_id": {"$type": "string"}},
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
