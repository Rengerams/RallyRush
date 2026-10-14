import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/play" element={<Play />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
