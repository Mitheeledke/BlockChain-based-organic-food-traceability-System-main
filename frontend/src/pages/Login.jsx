import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setAuthToken, fetchProfile } from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/dashboards.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
      setLoading(true);
      setError(null);
    try {
      const res = await login({ email, password });
      const { token } = res.data;
      setAuthToken(token);
      localStorage.setItem("token", token);

      const profile = await fetchProfile();
      const role = profile.data.role;
      if (role === "Farmer") navigate("/farmer");
      else if (role === "Distributor") navigate("/distributor");
      else if (role === "Retailer") navigate("/retailer");
      else if (role === "Admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
        } finally {
          setLoading(false);
        }
    };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>🔐 Dashboard Login</h2>
            <p>Welcome back! Enter your credentials to access your dashboard</p>
          </div>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Logging in..." : "🔓 Login"}
            </button>
          </form>
          <div className="login-footer">
            <p>Don't have an account?</p>
            <p>Contact your administrator for registration</p>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
