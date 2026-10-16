import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import OptionGroup from "@/components/OptionGroup";
import LegendCard from "@/components/LegendCard";
import { SurfacePreview } from "@/components/game/SurfacePreview";
import { DIFFICULTY, STYLES, SURFACES, FORMATS, ATTR_BUDGET, LEGEND, DEFAULT_SETUP } from "@/game/constants";
import { loadSetup, storeSetup } from "@/lib/api";
import FirstSessionGuide from "@/components/game/FirstSessionGuide";
import LocalDataControls from "@/components/game/LocalDataControls";
import { hasCompletedTutorial } from "@/lib/tutorial";
import { applySetupPreset, SETUP_PRESETS } from "@/game/setupPresets";

const ATTRS = ["power", "stamina", "accuracy"];

function AttrSlider({ attr, value, onChange, disabled }) {
  const labelId = `setup-attr-${attr}-label`;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span id={labelId} className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">{attr}</span>
        <span data-testid={`setup-attr-${attr}-value`} className="font-display text-3xl font-black">{value}</span>
      </div>
      <Slider thumbProps={{ "aria-labelledby": labelId, "aria-valuetext": `${value} out of 10` }} data-testid={`setup-attr-${attr}-slider`} className="mt-2" min={1} max={10} step={1} value={[value]} disabled={disabled} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export default function Setup() {
  const nav = useNavigate();
  const [cfg, setCfg] = useState(loadSetup);
  const [guideOpen, setGuideOpen] = useState(() => !hasCompletedTutorial());
  const [selectedPreset, setSelectedPreset] = useState(null);
  const set = (k, v) => {
    setSelectedPreset(null);
    setCfg((c) => ({ ...c, [k]: v }));
  };
  const used = ATTRS.reduce((s, a) => s + cfg[a], 0);

  const setAttr = (attr, v) => {
    const others = used - cfg[attr];
    set(attr, Math.min(v, ATTR_BUDGET - others));
  };
  const toggleLegend = () => setCfg((c) => (c.legend
    ? { ...c, legend: false, name: DEFAULT_SETUP.name, power: 6, stamina: 6, accuracy: 6 }
    : { ...c, legend: true, ...LEGEND }));
  const persistSetup = () => {
    const final = { ...cfg, name: cfg.name.trim().slice(0, 24) || "Player" };
    storeSetup(final);
  };
  const start = () => {
    persistSetup();
    nav("/play");
  };
  const practice = () => {
    persistSetup();
    nav("/practice");
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-32 pt-10 lg:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00F0FF]">Match setup</p>
      <h1 className="font-display mt-2 text-5xl font-black uppercase italic sm:text-6xl">Build your player</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-6">
          <LegendCard active={cfg.legend} onToggle={toggleLegend} />
          <div className="rounded-2xl border border-white/10 bg-[#121824] p-5">
            <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400" htmlFor="pname">Player name</label>
            <input id="pname" data-testid="setup-name-input" value={cfg.name} disabled={cfg.legend} maxLength={24} onChange={(e) => set("name", e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#0B0E14] px-4 py-3 font-display text-2xl font-bold uppercase outline-none transition-colors focus:border-[#DFFF00] disabled:opacity-60" />
            <div className="mt-6 space-y-5">
              {ATTRS.map((a) => <AttrSlider key={a} attr={a} value={cfg[a]} disabled={cfg.legend} onChange={(v) => setAttr(a, v)} />)}
            </div>
            <p data-testid="setup-budget" className="mt-5 font-mono text-xs text-slate-400">
              {cfg.legend ? "Legend preset · budget unlocked" : `Attribute budget ${used}/${ATTR_BUDGET}`}
            </p>
          </div>
        </aside>
        <section className="space-y-8">
          <section aria-labelledby="quick-preset-title" className="rounded-2xl border border-white/10 bg-[#121824] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="quick-preset-title" className="font-display text-2xl font-black uppercase italic">Quick-play presets</h2>
              <p className="font-mono text-[10px] text-slate-400">Only match settings change · edit any choice below</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Quick-play presets">
              {SETUP_PRESETS.map((preset) => <button key={preset.id} type="button" data-testid={`setup-preset-${preset.id}`} aria-pressed={selectedPreset === preset.id} onClick={() => applyPreset(preset.id)} className={`rounded-xl border p-3 text-left transition-colors ${selectedPreset === preset.id ? "border-[#DFFF00]/60 bg-[#DFFF00]/10" : "border-white/10 bg-black/10 hover:border-white/25"}`}>
                <span className="block font-mono text-xs font-bold uppercase text-white">{preset.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-300">{preset.detail}</span>
              </button>)}
            </div>
            <p className="mt-3 font-mono text-[10px] text-slate-400">Your player name and attributes stay as you set them.</p>
          </section>
          <OptionGroup label="AI difficulty" options={Object.values(DIFFICULTY).map((d) => ({ ...d, desc: `${Math.round(d.error * 100)}% error · ${d.move}x speed` }))} value={cfg.difficulty} onChange={(v) => set("difficulty", v)} testPrefix="setup-difficulty" />
          <OptionGroup label="AI play style" options={Object.values(STYLES)} value={cfg.style} onChange={(v) => set("style", v)} testPrefix="setup-style" />
          <OptionGroup label="Court surface" cols={5} options={Object.values(SURFACES)} value={cfg.surface} onChange={(v) => set("surface", v)} testPrefix="setup-surface" />
          <SurfacePreview surface={cfg.surface} />
          <OptionGroup label="Match format" cols={2} options={Object.values(FORMATS)} value={cfg.format} onChange={(v) => set("format", v)} testPrefix="setup-format" />
        </section>
      </div>
      <div className="mt-10">
        <LocalDataControls />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B0E14]/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <button type="button" data-testid="setup-replay-guide-btn" onClick={() => setGuideOpen(true)}
            className="btn-ghost rounded-full px-4 py-3 font-mono text-xs font-semibold uppercase">
            Controls guide
          </button>
          <div className="flex flex-1 items-center gap-2 md:flex-none">
            <button type="button" data-testid="setup-practice-btn" onClick={practice}
              className="btn-ghost flex-1 rounded-full px-3 py-3 font-mono text-[10px] font-semibold uppercase sm:px-4 sm:text-xs">
              Practice timing
            </button>
            <button type="button" data-testid="setup-start-match-btn" onClick={start}
              className="btn-volt flex-1 rounded-full py-4 font-display text-xl font-black uppercase italic tracking-wide md:flex-none md:px-16">
              Start match
            </button>
          </div>
        </div>
      </div>
      <FirstSessionGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </main>
  );
}
