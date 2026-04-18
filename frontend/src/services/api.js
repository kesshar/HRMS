import axios from "axios";

const API = axios.create({
  // Use Vite env override when available, otherwise default to localhost:5000 (local dev)
  // For production, uncomment or set VITE_API_URL to your deployed backend URL.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("employeeToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;