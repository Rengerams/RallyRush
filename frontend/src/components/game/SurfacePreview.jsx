import { SURFACES, BALL } from "@/game/constants";

export const SurfacePreview = ({ surface }) => {
  const s = SURFACES[surface];
  return <div data-testid="surface-preview" className="grid items-center gap-4 border-y border-white/10 py-5 sm:grid-cols-[1.3fr_1fr]" data-surface={surface}>
    <svg data-testid="surface-preview-court" role="img" aria-label={`${s.label} court preview`} viewBox="0 0 420 210" className="w-full" style={{ background: s.outer }}>
      <defs><pattern id="preview-texture" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.6" fill="white" opacity="0.09" /></pattern></defs>
      <rect x="30" y="25" width="360" height="160" fill={s.color} />
      <rect x="30" y="25" width="360" height="160" fill="url(#preview-texture)" />
      <g fill="none" stroke="white" strokeWidth="1.5" opacity="0.85"><rect x="52" y="38" width="316" height="134" /><path d="M52 54H368M52 156H368M125 54V156M295 54V156M125 105H295" /></g>
      <path d="M210 30V180" stroke="#111b20" strokeWidth="4" /><path d="M209 29V179" stroke="white" strokeWidth="1.5" />
      <path d="M86 130Q150 10 253 90T351 115" fill="none" stroke="#DFFF00" strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />
      <circle key={surface} cx="253" cy="90" r="5" fill="#DFFF00" className="surface-preview-ball" />
      <text x="210" y="200" textAnchor="middle" fill="white" opacity="0.6" fontFamily="monospace" fontSize="8">RENFFR OPEN</text>
    </svg>
    <div>
      <h2 data-testid="surface-preview-name" className="font-display text-lg font-bold uppercase">{s.label}</h2>
      <p data-testid="surface-preview-description" className="mt-1 text-sm text-slate-400">{s.sub}</p>
      <div className="mt-4 space-y-3">
        {[["pace", "Pace retention", s.friction], ["bounce", "Bounce", s.bounce * BALL.bounce]].map(([id, label, value]) => <div key={id}>
          <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-400"><span>{label}</span><span data-testid={`surface-preview-${id}`}>{Math.round(value * 100)}%</span></div>
          <div className="h-1 bg-white/10"><div className="h-full bg-[#00F0FF] transition-[width] duration-300" style={{ width: `${value * 100}%` }} /></div>
        </div>)}
      </div>
    </div>
  </div>;
};