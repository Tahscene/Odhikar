import axios from "axios";

// Set VITE_API_URL in Vercel's Environment Variables once the backend is deployed on Render.
// Locally it falls back to your backend running on localhost.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("odhikar_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
