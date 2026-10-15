import "@/App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";
import Home from "@/pages/Home";
import Setup from "@/pages/Setup";
import Play from "@/pages/Play";
import Leaderboard from "@/pages/Leaderboard";
import History from "@/pages/History";

function App() {
  return (
    <div className="App grain min-h-screen">
      <HashRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/play" element={<Play />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </HashRouter>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
