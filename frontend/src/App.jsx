import "@/App.css";
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";

const Home = lazy(() => import("@/pages/Home"));
const Setup = lazy(() => import("@/pages/Setup"));
const Play = lazy(() => import("@/pages/Play"));
const Practice = lazy(() => import("@/pages/Practice"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const History = lazy(() => import("@/pages/History"));

function RoutedApp() {
  const { pathname } = useLocation();
  const inMatch = pathname === "/play" || pathname === "/practice";

  return (
    <div className={`App grain ${inMatch ? "play-shell" : "min-h-screen"}`}>
      {!inMatch && <Nav />}
      <Suspense fallback={<main className="flex min-h-[60vh] items-center justify-center font-mono text-sm text-slate-400" role="status" aria-live="polite">Loading Rally Rush…</main>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/play" element={<Play />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Suspense>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <RoutedApp />
    </HashRouter>
  );
}

export default App;
