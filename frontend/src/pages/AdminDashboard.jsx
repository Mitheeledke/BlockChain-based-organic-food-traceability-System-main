import { useEffect, useState } from "react";
import * as blockchain from "../services/blockchain";
import "../styles/dashboards.css";
import { registerUser } from "../services/api";
import Navbar from "../components/Navbar";

export default function AdminDashboard() {
  const [account, setAccount] = useState("");
  const [allBatches, setAllBatches] = useState([]);
  const [batchDetails, setBatchDetails] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // registration fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regWallet, setRegWallet] = useState("");
  const [regRole, setRegRole] = useState("Farmer");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    async function init() {
      try {
        await blockchain.connectWallet();
        const acct = await blockchain.getCurrentAccount();
        setAccount(acct);
        await refreshBatches();
        setError("");
      } catch (err) {
        console.error("init failed", err);
        setError(err.message || "Failed to initialize");
      }
    }
    init();
  }, []);

  const refreshBatches = async () => {
    setLoading(true);
    try {
      const batches = await blockchain.getAllBatchIds();
      setAllBatches(batches);
      setError("");
    } catch (err) {
      console.error("failed to fetch batches", err);
      setError(err.message || "Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    try {
      await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        wallet_address: regWallet,
      });
      setRegSuccess(`Registered ${regRole.toLowerCase()} successfully`);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegWallet("");
    } catch (err) {
      console.error("registration failed", err);
      setRegError(
        err.response?.data?.message || err.message || "Registration error"
      );
    }
  };

  const handleViewBatchDetails = async (batchId) => {
    setLoading(true);
    try {
      const batch = await blockchain.getBatch(batchId);
      const children = await blockchain.getChildBatches(batchId);
      setBatchDetails({
        [batchId]: {
          ...batch,
          children,
        },
      });
      setSelectedBatch(batchId);
    } catch (err) {
      console.error("failed to fetch batch details", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Admin Dashboard</h1>
        <div className="account-info">
          <strong>Wallet Address:</strong>
          <code>{account || "Not connected"}</code>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* registration form */}
      <div className="form-section">
        <h2 className="form-section-title">👥 Register New User</h2>
        {regError && <div className="error-box">{regError}</div>}
        {regSuccess && <div className="success-message">{regSuccess}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-grid">
            <div className="form-group required">
              <label>Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group required">
              <label>Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group required">
              <label>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                value={regWallet}
                onChange={(e) => setRegWallet(e.target.value)}
              />
            </div>
            <div className="form-group required">
              <label>Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option>Farmer</option>
                <option>Distributor</option>
                <option>Retailer</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">📦 All Batches on Blockchain</h2>
        <div>
          <button onClick={refreshBatches} className="btn btn-primary" disabled={loading}>
            {loading ? "Refreshing..." : "🔄 Refresh Batches"}
          </button>
        </div>

        {allBatches.length === 0 ? (
          <div className="info-box">ℹ️ No batches found on the blockchain.</div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "1em", color: "#666", marginBottom: "15px" }}>
              Total Batches: <strong style={{ color: "#667eea" }}>{allBatches.length}</strong>
            </p>
            <div style={{ display: "grid", gap: "10px" }}>
              {allBatches.map((id) => (
                <div
                  key={id}
                  style={{
                    padding: "15px",
                    background: selectedBatch === id ? "#e8ecff" : "#f8f9fa",
                    border: selectedBatch === id ? "2px solid #667eea" : "1px solid #ddd",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  <strong style={{ fontSize: "1.1em", color: "#333" }}>{id}</strong>
                  <button
                    onClick={() => handleViewBatchDetails(id)}
                    className="btn btn-primary"
                    style={{ marginLeft: "10px" }}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedBatch && batchDetails[selectedBatch] && (
        <div className="batch-details">
          <h2 style={{ color: "#667eea", marginTop: 0, marginBottom: "20px" }}>📋 Batch Details: {selectedBatch}</h2>
          <div className="batch-details-row">
            <div className="detail-item">
              <strong>Batch ID</strong>
              <span>{batchDetails[selectedBatch].batchId}</span>
            </div>
            <div className="detail-item">
              <strong>Owner</strong>
              <span>{batchDetails[selectedBatch].owner}</span>
            </div>
            <div className="detail-item">
              <strong>Total Quantity</strong>
              <span>{batchDetails[selectedBatch].totalQuantity} {batchDetails[selectedBatch].unit}</span>
            </div>
            <div className="detail-item">
              <strong>Remaining Quantity</strong>
              <span>{batchDetails[selectedBatch].remainingQuantity} {batchDetails[selectedBatch].unit}</span>
            </div>
            <div className="detail-item">
              <strong>Created On</strong>
              <span>{new Date(Number(batchDetails[selectedBatch].timestamp) * 1000).toLocaleString()}</span>
            </div>
          </div>

          {batchDetails[selectedBatch].children && batchDetails[selectedBatch].children.length > 0 && (
            <div style={{ marginTop: "25px" }}>
              <h3 style={{ color: "#555" }}>🔗 Child Batches ({batchDetails[selectedBatch].children.length})</h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {batchDetails[selectedBatch].children.map((child) => (
                  <div
                    key={child}
                    style={{
                      padding: "12px",
                      background: "#f0f4ff",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "500", color: "#333" }}>{child}</span>
                    <button
                      onClick={() => handleViewBatchDetails(child)}
                      className="btn btn-secondary"
                      style={{ marginLeft: "10px", padding: "8px 16px", fontSize: "0.9em" }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}