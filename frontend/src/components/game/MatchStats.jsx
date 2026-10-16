const ROWS = [["aces", "Aces"], ["winners", "Winners"], ["errors", "Errors"], ["double_faults", "Double faults"], ["perfect_shots", "Perfect shots"], ["longest_rally", "Longest rally"], ["points_won", "Points won"]];

export const MatchStats = ({ stats = {}, opponentStats = {}, names = ["Player", "Opponent"], rallyLengths = [], prefix = "match-end" }) => {
  const playerStats = stats && typeof stats === "object" && !Array.isArray(stats) ? stats : {};
  const rivalStats = opponentStats && typeof opponentStats === "object" && !Array.isArray(opponentStats) ? opponentStats : {};
  const safeNames = Array.isArray(names) ? names : ["Player", "Opponent"];
  const rallies = Array.isArray(rallyLengths) ? rallyLengths.filter(Number.isFinite) : [];
  const average = rallies.length ? (rallies.reduce((a, b) => a + b, 0) / rallies.length).toFixed(1) : "—";
  const buckets = [0, 0, 0, 0];
  rallies.forEach(n => buckets[n <= 3 ? 0 : n <= 6 ? 1 : n <= 9 ? 2 : 3]++);
  const max = Math.max(1, ...buckets);
  return <div data-testid={`${prefix}-stats-breakdown`}>
    <div className="mb-4 flex justify-between gap-5 text-xs font-bold">
      <span data-testid={`${prefix}-player-name`} className="min-w-0 break-words text-[#00F0FF]">{safeNames[0] || "Player"}</span>
      <span data-testid={`${prefix}-opponent-name`} className="min-w-0 break-words text-right text-[#E05A47]">{safeNames[1] || "Opponent"}</span>
    </div>
    <div className="space-y-3">
      {ROWS.map(([key, label]) => {
        const p = Number.isFinite(Number(playerStats[key])) ? Number(playerStats[key]) : 0, a = Number.isFinite(Number(rivalStats[key])) ? Number(rivalStats[key]) : 0, total = p + a || 1;
        return <div key={key}>
          <div className="mb-1 flex items-center justify-between gap-2 font-mono text-xs">
            <span data-testid={`${prefix}-stat-${key}`} className="w-8 text-left text-white">{p}</span>
            <span className="text-slate-400">{label}</span>
            <span data-testid={`${prefix}-opponent-stat-${key}`} className="w-8 text-right text-white">{a}</span>
          </div>
          <div className="flex h-1.5 gap-1" aria-hidden="true">
            <div className="flex flex-1 justify-end bg-white/5"><div className="bg-[#00F0FF]" style={{ width: `${p / total * 100}%` }} /></div>
            <div className="flex flex-1 bg-white/5"><div className="bg-[#E05A47]" style={{ width: `${a / total * 100}%` }} /></div>
          </div>
        </div>;
      })}
    </div>
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex flex-wrap justify-between gap-2 font-mono text-xs">
        <span className="text-slate-400">Rally length · shots</span>
        <span data-testid={`${prefix}-average-rally`}>Average {average}</span>
      </div>
      <div data-testid={`${prefix}-rally-chart`} className="mt-3 grid grid-cols-4 gap-3" role="img" aria-label={`Rallies: ${buckets[0]} of 0 to 3 shots, ${buckets[1]} of 4 to 6, ${buckets[2]} of 7 to 9, ${buckets[3]} of 10 or more.`}>
        {buckets.map((count, i) => <div key={i} className="text-center font-mono text-[10px]">
          <span data-testid={`${prefix}-rally-bucket-${i}`} className="text-slate-300">{count}</span>
          <div className="mt-1 flex h-12 items-end bg-white/5"><div className="w-full bg-[#DFFF00]/80" style={{ height: `${count / max * 100}%` }} /></div>
          <span className="mt-1 block text-slate-400">{["0–3", "4–6", "7–9", "10+"][i]}</span>
        </div>)}
      </div>
    </div>
  </div>;
};