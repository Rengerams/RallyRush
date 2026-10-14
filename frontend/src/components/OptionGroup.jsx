export default function OptionGroup({ label, options, value, onChange, testPrefix, cols = 4 }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <div className={`mt-3 grid gap-2 grid-cols-2 ${cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-4"}`}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button key={o.id} type="button" data-testid={`${testPrefix}-${o.id}`} onClick={() => onChange(o.id)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 ${active ? "border-[#DFFF00] bg-[#DFFF00]/[0.07]" : "border-white/10 bg-[#121824] hover:border-white/30"}`}>
              {o.color && <span className="absolute right-3 top-3 h-4 w-4 rounded-full" style={{ background: o.color }} />}
              <span className={`font-display block text-xl font-extrabold uppercase ${active ? "text-[#DFFF00]" : ""}`}>{o.label}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{o.desc || o.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
