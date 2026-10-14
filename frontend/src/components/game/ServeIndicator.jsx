export const ServeIndicator = ({ snap }) => {
  if (snap?.state !== "serve") return null;
  const playerServing = snap.server === 0, toss = snap.serveStage === "toss";
  return <div data-testid="serve-indicator" className="pointer-events-none min-w-[104px] border-l-2 border-[#DFFF00] bg-[#0B0E14]/85 px-2 py-2">
    <p data-testid="serve-status" className="font-mono text-[10px] uppercase text-white">{playerServing ? (snap.faults ? "Second serve" : "Your serve") : "Receiving"}</p>
    {playerServing && <>
      <p data-testid="serve-action" className={`mt-1 font-display text-lg font-bold uppercase ${toss && snap.serveHeight > 0.85 ? "text-[#DFFF00]" : "text-white"}`}>{toss ? snap.serveHeight > 0.85 ? "Strike" : "Toss" : "Ready"}</p>
      {toss && <div data-testid="serve-timing-meter" role="meter" aria-label="Serve toss height" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(snap.serveHeight * 100)} className="relative mt-1 h-1.5 w-20 bg-white/15">
        <div className="absolute inset-y-0 right-0 w-[15%] bg-[#DFFF00]/30" /><div className="relative h-full bg-[#DFFF00]" style={{ width: `${snap.serveHeight * 100}%` }} />
      </div>}
    </>}
  </div>;
};