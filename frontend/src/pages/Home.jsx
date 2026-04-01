import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setAuthToken, fetchProfile } from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/dashboards.css";
import "../styles/home.css";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
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
      <div className="home-container">
        {!showLogin ? (
          <div className="home-content">
            <div className="hero-section">
              <div className="hero-text">
                <h1>🌾 Blockchain-Based Food Organic Traceability System</h1>
                <p className="hero-subtitle">
                  Ensuring Farm-to-Table Transparency Through Immutable Blockchain Records
                </p>
                <div className="hero-cta">
                  <button
                    className="btn btn-primary btn-large"
                    onClick={() => setShowLogin(true)}
                  >
                    🔐 Login to Dashboard
                  </button>
                  <button
                    className="btn btn-secondary btn-large"
                    onClick={() => navigate("/consumer")}
                  >
                    🔍 Trace Your Food
                  </button>
                </div>
              </div>
            </div>

            <div className="features-section">
              <h2>Key Features</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">👨‍🌾</div>
                  <h3>Farmer Registration</h3>
                  <p>
                    Register organic farms with GPS coordinates, certification details, and crop information
                    stored immutably on blockchain.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Batch Creation</h3>
                  <p>
                    Create crop batches with complete farming details including sowing date, harvest date,
                    and organic certification proofs.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🚚</div>
                  <h3>Distribution Tracking</h3>
                  <p>
                    Track product movement through supply chain with distributor details, transport information,
                    and quality checks.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🏪</div>
                  <h3>Retail Management</h3>
                  <p>
                    Manage retail inventory with shelf life tracking, storage conditions, and real-time
                    availability updates.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🔐</div>
                  <h3>Blockchain Security</h3>
                  <p>
                    All data is cryptographically secured on Ethereum blockchain, ensuring authenticity and
                    preventing tampering.
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h3>Consumer Verification</h3>
                  <p>
                    Consumers can scan QR codes or enter batch IDs to verify complete supply chain history
                    and certification authenticity.
                  </p>
                </div>
              </div>
            </div>

            <div className="benefits-section">
              <h2>Why Choose Our System?</h2>
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-number">✓</div>
                  <div className="benefit-text">
                    <h4>Complete Transparency</h4>
                    <p>Every step from farm to table is recorded and verified on an immutable ledger.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-number">✓</div>
                  <div className="benefit-text">
                    <h4>Certified Organic Proof</h4>
                    <p>GPS coordinates, certification details, and farming practices prove organic authenticity.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-number">✓</div>
                  <div className="benefit-text">
                    <h4>Tamper-Proof Records</h4>
                    <p>Blockchain ensures no data can be altered, protecting against fraud and adulteration.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-number">✓</div>
                  <div className="benefit-text">
                    <h4>Real-Time Tracking</h4>
                    <p>Monitor product movement and conditions throughout the entire supply chain in real-time.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="process-section">
              <h2>How It Works</h2>
              <div className="process-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <h3>Farmer Creates Batch</h3>
                  <p>Farmer registers crop batch with GPS location, certification, and farming details</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h3>Distributor Handles</h3>
                  <p>Distributor adds transport details, storage conditions, and quality checks</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h3>Retailer Stores</h3>
                  <p>Retailer logs storage conditions, pricing, shelf life, and availability</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">4</div>
                  <h3>Consumer Verifies</h3>
                  <p>Consumer scans QR code to view complete verified supply chain history</p>
                </div>
              </div>
            </div>

            <div className="tech-stack-section">
              <h2>Technology Stack</h2>
              <div className="tech-grid">
                <div className="tech-card">
                  <h4>Frontend</h4>
                  <p>React.js with Vite</p>
                </div>
                <div className="tech-card">
                  <h4>Backend</h4>
                  <p>Node.js & Express.js</p>
                </div>
                <div className="tech-card">
                  <h4>Blockchain</h4>
                  <p>Solidity & Hardhat</p>
                </div>
                <div className="tech-card">
                  <h4>Database</h4>
                  <p>MySQL & Sequelize</p>
                </div>
                <div className="tech-card">
                  <h4>Authentication</h4>
                  <p>JWT & Bcrypt</p>
                </div>
                <div className="tech-card">
                  <h4>Web3</h4>
                  <p>Ethers.js & MetaMask</p>
                </div>
              </div>
            </div>

            <div className="cta-footer">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of farmers and retailers ensuring food authenticity through blockchain</p>
              <button
                className="btn btn-primary btn-large"
                onClick={() => setShowLogin(true)}
              >
                Login to Your Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="login-modal">
            <div className="login-card">
              <button
                className="close-btn"
                onClick={() => {
                  setShowLogin(false);
                  setError(null);
                  setEmail("");
                  setPassword("");
                }}
              >
                ✕
              </button>
              <h2>🔐 Dashboard Login</h2>
              <p>Enter your credentials to access your account</p>
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
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
              <p className="login-footer">
                Don't have an account? Contact your administrator for registration.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
