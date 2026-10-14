// Port of ScoringSystem.cs (Love/15/30/40, deuce, advantage, win by 2) + tie-break & server rotation
const TENNIS = ["0", "15", "30", "40"];

export function createScore(fmt) {
  return { fmt, points: [0, 0], games: [0, 0], sets: [0, 0], setHistory: [], tiebreak: false, tbStarter: 0, gamesPlayed: 0, winner: null };
}

export function currentServer(s) {
  const gameServer = s.gamesPlayed % 2;
  if (!s.tiebreak) return gameServer;
  const n = s.points[0] + s.points[1];
  return (s.tbStarter + Math.floor((n + 1) / 2)) % 2;
}

function winSet(s, w, events) {
  s.sets[w]++;
  s.setHistory.push([...s.games]);
  s.games = [0, 0];
  s.tiebreak = false;
  events.push("set");
  if (s.sets[w] >= s.fmt.setsToWin) { s.winner = w; events.push("match"); }
}

function winGame(s, w, events) {
  const l = 1 - w;
  s.games[w]++;
  s.gamesPlayed++;
  s.points = [0, 0];
  events.push("game");
  const G = s.fmt.games;
  if (s.games[w] >= G && s.games[w] - s.games[l] >= 2) winSet(s, w, events);
  else if (s.games[w] === G && s.games[l] === G) { s.tiebreak = true; s.tbStarter = s.gamesPlayed % 2; events.push("tiebreak"); }
}

export function awardPoint(s, w) {
  const events = [];
  const l = 1 - w;
  s.points[w]++;
  const pw = s.points[w];
  const pl = s.points[l];
  if (s.tiebreak) {
    if (pw >= 7 && pw - pl >= 2) {
      s.games[w]++;
      s.gamesPlayed++;
      s.points = [0, 0];
      events.push("game");
      winSet(s, w, events);
    }
    return events;
  }
  if (pw >= 4 && pw >= pl + 2) { winGame(s, w, events); return events; }
  if (pw >= 3 && pl >= 3) events.push(pw === pl ? "deuce" : "advantage");
  return events;
}

export function pointLabels(s) {
  const [a, b] = s.points;
  if (s.tiebreak) return [String(a), String(b)];
  if (a >= 3 && b >= 3) {
    if (a === b) return ["40", "40"];
    return a > b ? ["AD", ""] : ["", "AD"];
  }
  return [TENNIS[Math.min(a, 3)], TENNIS[Math.min(b, 3)]];
}

export function scoreCall(s, events, names, w) {
  if (events.includes("match")) return `Game, Set & Match ${names[w]}`;
  if (events.includes("set")) return `Set ${names[w]}`;
  if (events.includes("tiebreak")) return "Tie-break";
  if (events.includes("game")) return `Game ${names[w]}`;
  if (events.includes("deuce")) return "Deuce";
  if (events.includes("advantage")) return `Advantage ${names[w]}`;
  const srv = currentServer(s);
  const [p0, p1] = pointLabels(s);
  const a = srv === 0 ? p0 : p1;
  const b = srv === 0 ? p1 : p0;
  const say = (v) => (v === "0" ? "Love" : v);
  return a === b ? `${say(a)} All` : `${say(a)} – ${say(b)}`;
}
