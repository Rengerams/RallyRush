import axios from "axios";
import { SETUP_KEY, DEFAULT_SETUP } from "@/game/constants";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const saveMatch = (payload) => axios.post(`${API}/matches`, payload).then((r) => r.data);
export const fetchMatches = (params) => axios.get(`${API}/matches`, { params }).then((r) => r.data);
export const fetchLeaderboard = () => axios.get(`${API}/leaderboard`).then((r) => r.data);

export const loadSetup = () => {
  try { return { ...DEFAULT_SETUP, ...JSON.parse(localStorage.getItem(SETUP_KEY) || "{}") }; }
  catch { return DEFAULT_SETUP; }
};
export const storeSetup = (s) => localStorage.setItem(SETUP_KEY, JSON.stringify(s));
