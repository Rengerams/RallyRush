import { Link, NavLink } from "react-router-dom";
import { Crown } from "lucide-react";

const links = [
  { to: "/setup", label: "Play", id: "nav-play-link" },
  { to: "/leaderboard", label: "Leaderboard", id: "nav-leaderboard-link" },
  { to: "/history", label: "History", id: "nav-history-link" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0E14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-3 sm:h-16 sm:gap-6 sm:px-5 lg:px-10">
        <Link to="/" data-testid="nav-home-link" className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#DFFF00] shadow-[0_0_14px_#DFFF00]" />
          <span className="font-display text-xl font-black italic uppercase tracking-tight sm:text-2xl">Renffr<span className="text-[#DFFF00]">Open</span></span>
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} data-testid={l.id}
              className={({ isActive }) => `rounded-full px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] sm:px-3 sm:text-xs sm:tracking-[0.15em] transition-colors duration-150 ${isActive ? "bg-white/10 text-[#DFFF00]" : "text-slate-400 hover:text-white"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <span data-testid="nav-renffr-badge" className="hidden items-center gap-1.5 rounded-full border border-[#FFC828]/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFC828] md:flex">
          <Crown size={13} /> renffr edition
        </span>
      </div>
    </header>
  );
}
