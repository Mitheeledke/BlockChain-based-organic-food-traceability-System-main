import axios from "axios";

// baseURL can be configured through environment variables (Vite uses VITE_ prefix)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// helper to set the authorization header for future requests
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
}

// authentication endpoints
export async function registerUser({ name, email, password, role, wallet_address }) {
  return API.post("/auth/register", { name, email, password, role, wallet_address });
}

export async function login({ email, password }) {
  return API.post("/auth/login", { email, password });
}

export async function fetchProfile() {
  return API.get("/auth/me");
}

// you may add further backend helpers below (e.g. admin routes) as needed

export default API;
