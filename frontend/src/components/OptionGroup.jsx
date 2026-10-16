import * as RadioGroup from "@radix-ui/react-radio-group";

export default function OptionGroup({ label, options, value, onChange, testPrefix, cols = 4 }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <RadioGroup.Root
        aria-label={label}
        value={value}
        onValueChange={onChange}
        className={`mt-3 grid gap-2 grid-cols-2 ${cols === 5 ? "md:grid-cols-5" : cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-4"}`}
      >
        {options.map((o) => {
          const active = o.id === value;
          return (
            <RadioGroup.Item key={o.id} value={o.id} type="button" data-testid={`${testPrefix}-${o.id}`}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF00] ${active ? "border-[#DFFF00] bg-[#DFFF00]/[0.07]" : "border-white/10 bg-[#121824] hover:border-white/30"}`}>
              {o.color && <span aria-hidden="true" className="absolute right-3 top-3 h-4 w-4 rounded-full" style={{ background: o.color }} />}
              <span className={`font-display block text-xl font-extrabold uppercase ${active ? "text-[#DFFF00]" : ""}`}>{o.label}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{o.desc || o.sub}</span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
    </div>
  );
}
