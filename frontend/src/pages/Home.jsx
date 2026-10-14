import { Link } from "react-router-dom";
import { Crown, Gauge, Zap, Wind, ArrowUpRight } from "lucide-react";
import { SHOT_LIST } from "@/game/constants";

const HERO = "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

const features = [
  { icon: Gauge, title: "Timing is everything", text: "Every swing graded Miss · Late · Good · Perfect, straight from the original shot engine." },
  { icon: Zap, title: "4 AI minds", text: "Easy to Pro, playing Baseline, Net Rusher, Defensive or Aggressive tennis." },
  { icon: Wind, title: "3 surfaces", text: "Hard, Clay and Grass each change bounce, skid and footspeed." },
];

export default function Home() {
  return (
    <main className="court-grid">
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pt-20">
        <div className="fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00F0FF]">Top-down tennis · single player vs AI</p>
          <h1 className="font-display mt-5 text-6xl font-black uppercase italic leading-[0.85] tracking-tight sm:text-7xl lg:text-[8.5rem]">
            The <span className="text-[#DFFF00]">Renffr</span><br />Open
          </h1>
          <p className="mt-6 max-w-lg text-base text-slate-400 sm:text-lg">
            The Unity tennis project, rebuilt for the browser. Seven shots, real deuce & advantage scoring, stamina, slides and an umpire who calls every point.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/setup" data-testid="home-play-btn" className="btn-volt rounded-full px-8 py-4 font-display text-xl font-extrabold uppercase tracking-wide">Enter the court</Link>
            <Link to="/leaderboard" data-testid="home-leaderboard-btn" className="btn-ghost rounded-full px-7 py-4 font-display text-xl font-bold uppercase tracking-wide">Leaderboard</Link>
          </div>
          <div data-testid="home-renffr-tribute" className="mt-12 inline-flex items-center gap-4 rounded-2xl border border-[#FFC828]/30 bg-[#FFC828]/[0.04] px-5 py-4">
            <Crown className="text-[#FFC828]" size={30} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FFC828]/70">Tournament founder</p>
              <p className="font-display gold-shimmer text-3xl font-black uppercase italic">renffr</p>
            </div>
          </div>
        </div>
        <div className="fade-up relative" style={{ animationDelay: "150ms" }}>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10">
            <img src={HERO} alt="Tennis player on court" className="h-[460px] w-full object-cover lg:h-[560px]" />
            <div className="absolute inset-0 bg-[#0B0E14]/30" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#121824]/75 p-5 backdrop-blur-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">Shot keys</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SHOT_LIST.map((s) => (
                  <span key={s.id} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm"><span className="key-cap">{s.key}</span>{s.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-px border-y border-white/[0.06] bg-white/[0.06] md:grid-cols-3">
        {features.map((f, i) => (
          <div key={f.title} className="fade-up bg-[#0B0E14] p-8 lg:p-12" style={{ animationDelay: `${250 + i * 100}ms` }}>
            <f.icon className="text-[#DFFF00]" size={26} />
            <h3 className="font-display mt-5 text-3xl font-extrabold uppercase">{f.title}</h3>
            <p className="mt-2 text-slate-400">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-8 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 lg:px-10">
        <span>Crafted for <span className="text-[#FFC828]">renffr</span></span>
        <Link to="/history" data-testid="home-history-link" className="flex items-center gap-1 hover:text-white">Match history <ArrowUpRight size={14} /></Link>
      </footer>
    </main>
  );
}
