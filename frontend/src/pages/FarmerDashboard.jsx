import { useEffect, useState } from "react";
import * as blockchain from "../services/blockchain";
import { uploadFileToIpfs, makeIpfsUrl } from "../services/ipfs";
import "../styles/dashboards.css";
import Navbar from "../components/Navbar";

export default function FarmerDashboard() {
  const [account, setAccount] = useState("");
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ipfsError, setIpfsError] = useState("");
  const [farmerData, setFarmerData] = useState({
    farmerId: 1,
    farmerName: "",
    farmAddressFull: "",
    gpsCoordinates: "",
    farmAreaInAcres: 0,
    cropName: "",
    cropVariety: "",
    seedSource: "",
    sowingDate: "",
    harvestDate: "",
    soilHealthStatus: "",
    fertilizerUsed: "",
    organicCertificationAuthority: "",
    certificationNumber: "",
    certificationExpiryDate: "",
    farmPhotoHash: "",
    productPhotoHash: "",
  });
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("kg");
  const [geoLoading, setGeoLoading] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [farmPhotoUrl, setFarmPhotoUrl] = useState("");
  const [productPhotoUrl, setProductPhotoUrl] = useState("");

  // Capture current GPS location using browser geolocation API
  const handleGetCurrentLocation = () => {
    setGeoLoading(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${accuracy.toFixed(0)}m)`;
        setFarmerData((prev) => ({
          ...prev,
          gpsCoordinates: coords,
        }));
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        const messages = {
          "PERMISSION_DENIED": "Location permission denied. Please enable it in browser settings.",
          "POSITION_UNAVAILABLE": "Location information is unavailable.",
          "TIMEOUT": "Geolocation request timed out. Please try again.",
        };
        setError(messages[error.code] || "Failed to get location. Please try again.");
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleFileUpload = async (event, fieldName, previewSetter) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIpfsError("");
    try {
      const hash = await uploadFileToIpfs(file);
      setFarmerData((prev) => ({ ...prev, [fieldName]: hash }));
      if (previewSetter) {
        previewSetter(makeIpfsUrl(hash));
      }
    } catch (err) {
      console.error("IPFS upload failed", err);
      setIpfsError(err.message || "Failed to upload file to IPFS");
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await blockchain.connectWallet();
        const acct = await blockchain.getCurrentAccount();
        setAccount(acct);
        setError("");
      } catch (err) {
        console.error("wallet connect failed", err);
        setError(err.message || JSON.stringify(err));
      }
    }
    init();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFarmerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Convert dates to timestamps
    const sowingTimestamp = farmerData.sowingDate
      ? blockchain.toTimestamp(new Date(farmerData.sowingDate))
      : 0;
    const harvestTimestamp = farmerData.harvestDate
      ? blockchain.toTimestamp(new Date(farmerData.harvestDate))
      : 0;
    const certExpiryTimestamp = farmerData.certificationExpiryDate
      ? blockchain.toTimestamp(new Date(farmerData.certificationExpiryDate))
      : 0;

    const submittedData = {
      ...farmerData,
      sowingDate: sowingTimestamp,
      harvestDate: harvestTimestamp,
      certificationExpiryDate: certExpiryTimestamp,
      farmAreaInAcres: parseInt(farmerData.farmAreaInAcres) || 0,
      farmerId: parseInt(farmerData.farmerId) || 1,
    };

    try {
      const response = await blockchain.createFarmerBatch(
        submittedData,
        parseInt(quantity) || 0,
        unit,
        farmerData.productPhotoHash || ""
      );
      console.log("Batch created", response);

      if (response.batchId) {
        setBatchId(response.batchId.toString());
      } else if (response.eventLog?.args) {
        setBatchId(response.eventLog.args[0]?.toString() || "Created");
      } else {
        setBatchId("Created");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🌾 Farmer Dashboard</h1>
        <div className="account-info">
          <strong>Wallet Address:</strong>
          <code>{account || "Not connected"}</code>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {ipfsError && <div className="error-box">{ipfsError}</div>}
      {batchId && (
        <div className="success-message">
          Batch created successfully! Batch ID: <strong>{batchId}</strong>
        </div>
      )}

      <form onSubmit={handleCreateBatch}>
        <div className="form-section">
          <h2 className="form-section-title">Farmer Information</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Farmer Name</label>
              <input
                type="text"
                name="farmerName"
                value={farmerData.farmerName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group required">
              <label>Farm Address</label>
              <input
                type="text"
                name="farmAddressFull"
                value={farmerData.farmAddressFull}
                onChange={handleInputChange}
                placeholder="123 Farm Road, Village, State"
                required
              />
            </div>
            <div className="form-group required">
              <label>GPS Coordinates</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  name="gpsCoordinates"
                  value={farmerData.gpsCoordinates}
                  onChange={handleInputChange}
                  placeholder="28.7041° N, 77.1025° E"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading || loading}
                  style={{
                    padding: "10px 16px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontSize: "0.9em",
                    fontWeight: "600",
                  }}
                >
                  {geoLoading ? "📍 Getting..." : "📍 Current Location"}
                </button>
              </div>
            </div>
            <div className="form-group required">
              <label>Farm Area (Acres)</label>
              <input
                type="number"
                name="farmAreaInAcres"
                value={farmerData.farmAreaInAcres}
                onChange={handleInputChange}
                placeholder="10"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Crop Information</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Crop Name</label>
              <input
                type="text"
                name="cropName"
                value={farmerData.cropName}
                onChange={handleInputChange}
                placeholder="Tomato, Carrot, Wheat"
                required
              />
            </div>
            <div className="form-group required">
              <label>Crop Variety</label>
              <input
                type="text"
                name="cropVariety"
                value={farmerData.cropVariety}
                onChange={handleInputChange}
                placeholder="Hybrid F1, Cherry, Winter"
                required
              />
            </div>
            <div className="form-group required">
              <label>Seed Source</label>
              <input
                type="text"
                name="seedSource"
                value={farmerData.seedSource}
                onChange={handleInputChange}
                placeholder="Certified Seed Bank, Local Supplier"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Cultivation Dates</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Sowing Date</label>
              <input
                type="date"
                name="sowingDate"
                value={farmerData.sowingDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group required">
              <label>Harvest Date</label>
              <input
                type="date"
                name="harvestDate"
                value={farmerData.harvestDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Soil & Crop Health</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Soil Health Status</label>
              <input
                type="text"
                name="soilHealthStatus"
                value={farmerData.soilHealthStatus}
                onChange={handleInputChange}
                placeholder="Rich, Balanced pH, Nutrient Tested"
                required
              />
            </div>
            <div className="form-group required">
              <label>Fertilizer Used</label>
              <input
                type="text"
                name="fertilizerUsed"
                value={farmerData.fertilizerUsed}
                onChange={handleInputChange}
                placeholder="Organic compost, Vermicompost, Bio-fertilizer"
                required
              />
            </div>
            <div className="form-group">
              <label>Farm / Crop Photo (IPFS Upload)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "farmPhotoHash", setFarmPhotoUrl)}
              />
              {farmPhotoUrl && (
                <a href={farmPhotoUrl} target="_blank" rel="noreferrer" className="trace-link">
                  View uploaded farm photo
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Evidence Upload</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Certificate Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "productPhotoHash", setProductPhotoUrl)}
              />
              {productPhotoUrl && (
                <a href={productPhotoUrl} target="_blank" rel="noreferrer" className="trace-link">
                  View uploaded product photo
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Organic Certification</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Certification Authority</label>
              <input
                type="text"
                name="organicCertificationAuthority"
                value={farmerData.organicCertificationAuthority}
                onChange={handleInputChange}
                placeholder="IFOAM, USDA, ECOCERT"
                required
              />
            </div>
            <div className="form-group required">
              <label>Certification Number</label>
              <input
                type="text"
                name="certificationNumber"
                value={farmerData.certificationNumber}
                onChange={handleInputChange}
                placeholder="CERT-2024-12345"
                required
              />
            </div>
            <div className="form-group required">
              <label>Certification Expiry Date</label>
              <input
                type="date"
                name="certificationExpiryDate"
                value={farmerData.certificationExpiryDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Batch Details</h2>
          <div className="form-grid">
            <div className="form-group required">
              <label>Total Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000"
                min="1"
                step="1"
                required
              />
            </div>
            <div className="form-group required">
              <label>Unit of Measurement</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
                <option value="litre">Litre (L)</option>
                <option value="gallon">Gallon (gal)</option>
                <option value="piece">Piece</option>
                <option value="box">Box</option>
                <option value="crate">Crate</option>
              </select>
            </div>
          </div>
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading"></span> Creating Batch...
              </>
            ) : (
              "✅ Create Batch"
            )}
          </button>
          <button
            type="reset"
            className="btn btn-secondary"
            disabled={loading}
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={() => setShowProof(!showProof)}
            className="btn btn-info"
            style={{
              background: "#48bb78",
              marginLeft: "auto",
            }}
          >
            {showProof ? "✓ Hide" : "📋 View"} Proof of Certification
          </button>
        </div>
      </form>

      {showProof && (
        <div className="form-section" style={{ marginTop: "30px", background: "#f0f9ff", borderLeft: "4px solid #48bb78" }}>
          <h2 className="form-section-title" style={{ color: "#2d5016" }}>
            📜 Organic Certification Proof
          </h2>
          <p style={{ color: "#555", marginBottom: "20px", fontSize: "0.95em" }}>
            This is the complete record that will be stored on the blockchain as proof of organic certification.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>👨‍🌾 Farmer Information</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Farmer Name:</strong> {farmerData.farmerName || "—"}</p>
                <p><strong>Farm Address:</strong> {farmerData.farmAddressFull || "—"}</p>
                <p><strong>GPS Coordinates:</strong> {farmerData.gpsCoordinates || "—"}</p>
                <p><strong>Farm Area:</strong> {farmerData.farmAreaInAcres || "—"} acres</p>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>🌱 Crop Information</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Crop Name:</strong> {farmerData.cropName || "—"}</p>
                <p><strong>Crop Variety:</strong> {farmerData.cropVariety || "—"}</p>
                <p><strong>Seed Source:</strong> {farmerData.seedSource || "—"}</p>
                <p><strong>Soil Health:</strong> {farmerData.soilHealthStatus || "—"}</p>
                <p><strong>Fertilizer Used:</strong> {farmerData.fertilizerUsed || "—"}</p>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>📅 Cultivation Dates</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Sowing Date:</strong> {farmerData.sowingDate ? new Date(farmerData.sowingDate).toLocaleDateString() : "—"}</p>
                <p><strong>Harvest Date:</strong> {farmerData.harvestDate ? new Date(farmerData.harvestDate).toLocaleDateString() : "—"}</p>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#48bb78", fontSize: "1.1em" }}>✅ Organic Certification</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Authority:</strong> {farmerData.organicCertificationAuthority || "—"}</p>
                <p><strong>Cert Number:</strong> {farmerData.certificationNumber || "—"}</p>
                <p><strong>Expiry Date:</strong> {farmerData.certificationExpiryDate ? new Date(farmerData.certificationExpiryDate).toLocaleDateString() : "—"}</p>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>📦 Batch Details</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Total Quantity:</strong> {quantity || "—"} {unit}</p>
                <p><strong>Wallet:</strong><br /><code style={{ fontSize: "0.8em", wordBreak: "break-all" }}>{account || "Not connected"}</code></p>
              </div>
            </div>

            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}>
              <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>📸 Uploaded Evidence</h3>
              <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                <p><strong>Farm Photo:</strong> {farmPhotoUrl ? <a href={farmPhotoUrl} target="_blank" rel="noreferrer">Open</a> : "—"}</p>
                <p><strong>Product Photo:</strong> {productPhotoUrl ? <a href={productPhotoUrl} target="_blank" rel="noreferrer">Open</a> : "—"}</p>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: "20px",
            padding: "14px",
            background: "#edf2f7",
            borderLeft: "3px solid #48bb78",
            borderRadius: "4px",
            fontSize: "0.9em",
            color: "#2d3748",
          }}>
            <strong>⏱️ Blockchain Record:</strong> This data will be permanently recorded on the blockchain when you click "Create Batch" and can be verified by any stakeholder in the supply chain.
          </div>
        </div>
      )}
    </div>
    </>
  );
}
