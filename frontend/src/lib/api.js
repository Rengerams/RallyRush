import axios from "axios";
import { SETUP_KEY, DEFAULT_SETUP, SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const saveMatch = (payload) => axios.post(`${API}/matches`, payload).then((r) => r.data);
export const fetchMatches = (params) => axios.get(`${API}/matches`, { params }).then((r) => r.data);
export const fetchLeaderboard = (mode = "competitive") => axios.get(`${API}/leaderboard`, { params: { mode } }).then((r) => r.data);

function validateSetup(raw) {
  const s = { ...DEFAULT_SETUP, ...raw };
  if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 24) s.name = DEFAULT_SETUP.name;
  for (const attr of ["power", "stamina", "accuracy"]) {
    if (!Number.isInteger(s[attr]) || s[attr] < 1 || s[attr] > 10) s[attr] = DEFAULT_SETUP[attr];
  }
  if (typeof s.legend !== "boolean") s.legend = false;
  if (!s.legend && s.power + s.stamina + s.accuracy > 18) {
    s.power = 6; s.stamina = 6; s.accuracy = 6;
  }
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
