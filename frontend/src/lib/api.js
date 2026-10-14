import axios from "axios";
import { SETUP_KEY, DEFAULT_SETUP, SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const saveMatch = (payload) => axios.post(`${API}/matches`, payload).then((r) => r.data);
export const fetchMatches = (params) => axios.get(`${API}/matches`, { params }).then((r) => r.data);
export const fetchLeaderboard = () => axios.get(`${API}/leaderboard`).then((r) => r.data);

function validateSetup(raw) {
  const s = { ...DEFAULT_SETUP, ...raw };
  if (typeof s.name !== "string" || s.name.length > 32) s.name = DEFAULT_SETUP.name;
  if (!SURFACES[s.surface]) s.surface = DEFAULT_SETUP.surface;
  if (!DIFFICULTY[s.difficulty]) s.difficulty = DEFAULT_SETUP.difficulty;
  if (!STYLES[s.style]) s.style = DEFAULT_SETUP.style;
  if (!FORMATS[s.format]) s.format = DEFAULT_SETUP.format;
  return s;
}

export const loadSetup = () => {
  try { return validateSetup(JSON.parse(localStorage.getItem(SETUP_KEY) || "{}")); }
  catch { return { ...DEFAULT_SETUP }; }
};
export const storeSetup = (s) => localStorage.setItem(SETUP_KEY, JSON.stringify(s));
