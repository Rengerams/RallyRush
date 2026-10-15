import "@/App.css";
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";

const Home = lazy(() => import("@/pages/Home"));
const Setup = lazy(() => import("@/pages/Setup"));
const Play = lazy(() => import("@/pages/Play"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const History = lazy(() => import("@/pages/History"));

function App() {
  return (
    <div className="App grain min-h-screen">
      <HashRouter>
        <Nav />
        <Suspense fallback={<main className="flex min-h-[60vh] items-center justify-center font-mono text-sm text-slate-400" role="status" aria-live="polite">Loading Rally Rush…</main>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/play" element={<Play />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Suspense>
      </HashRouter>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
