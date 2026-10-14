from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
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
    aces: int = 0
    double_faults: int = 0
    winners: int = 0
    errors: int = 0
    perfect_shots: int = 0
    total_shots: int = 0
    longest_rally: int = 0
    points_won: int = 0


class MatchIn(BaseModel):
    player_name: str = Field(min_length=1, max_length=24)
    won: bool
    difficulty: Literal["easy", "medium", "hard", "pro"]
    ai_style: Literal["baseline", "netrusher", "defensive", "aggressive"]
    surface: Literal["hard", "clay", "grass"]
    match_format: Literal["quick", "standard"]
    sets: List[List[int]]
    duration_sec: int = 0
    legend: bool = False
    stats: MatchStats
    opponent_points: int = 0


class Match(BaseDocument, MatchIn):
    rating_points: int = 0
    created_at: str


@api_router.get("/")
async def root():
    return {"message": "RENFFR OPEN Tennis API"}


@api_router.post("/matches", response_model=Match, response_model_by_alias=False)
async def create_match(body: MatchIn):
    name = body.player_name.strip()
    rating = DIFF_POINTS[body.difficulty] if body.won else 2
    match = Match(**body.model_dump(exclude={"player_name"}), player_name=name,
                  rating_points=rating, created_at=datetime.now(timezone.utc).isoformat())
    res = await db.matches.insert_one(match.to_mongo())
    match.id = str(res.inserted_id)
    return match


@api_router.get("/matches", response_model=List[Match], response_model_by_alias=False)
async def list_matches(player: Optional[str] = None, surface: Optional[str] = None, limit: int = Query(50, le=200)):
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
async def leaderboard(limit: int = Query(50, le=200)):
    pipeline = [
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
