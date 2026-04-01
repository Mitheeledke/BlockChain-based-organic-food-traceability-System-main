import { useEffect, useState } from "react";
import * as blockchain from "../services/blockchain";
import "../styles/dashboards.css";
import Navbar from "../components/Navbar";

export default function DistributorDashboard() {
  const [account, setAccount] = useState("");
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchInfo, setBatchInfo] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [distributorData, setDistributorData] = useState({
    distributorId: 1,
    companyName: "",
    companyAddressFull: "",
    transportVehicleNumber: "",
    pickupDate: "",
    deliveryDate: "",
    storageTemperature: "",
    warehouseLocation: "",
    qualityCheckStatus: "Good",
  });

  useEffect(() => {
    async function init() {
      try {
        await blockchain.connectWallet();
        const acct = await blockchain.getCurrentAccount();
        setAccount(acct);
        const batches = await blockchain.getAllBatchIds();
        setAllBatches(batches);
      } catch (err) {
        console.error("init failed", err);
        setError(err.message || "Failed to initialize");
      }
    }
    init();
  }, []);

  // whenever the selected batch changes, fetch its info so we can show remaining quantity
  useEffect(() => {
    if (!selectedBatchId) {
      setBatchInfo(null);
      return;
    }
    async function loadBatch() {
      try {
        const info = await blockchain.getBatch(selectedBatchId);
        setBatchInfo(info);
      } catch (err) {
        console.error("failed to load batch info", err);
        setError(err.message || "Could not load batch information");
      }
    }
    loadBatch();
  }, [selectedBatchId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDistributorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePurchaseBatch = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    if (!selectedBatchId) {
      setError("Please select a batch");
      return;
    }

    setLoading(true);
    try {
      const receipt = await blockchain.purchaseBatch(selectedBatchId, parseInt(purchaseQuantity) || 0);
      console.log("Batch purchased", receipt);
      setSuccessMessage(`✅ Batch purchased successfully! Quantity: ${purchaseQuantity}`);
      setPurchaseQuantity(0);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDistributorDetails = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedBatchId) {
      setError("Please select a batch");
      return;
    }

    setLoading(true);
    const pickupTimestamp = distributorData.pickupDate
      ? blockchain.toTimestamp(new Date(distributorData.pickupDate))
      : 0;
    const deliveryTimestamp = distributorData.deliveryDate
      ? blockchain.toTimestamp(new Date(distributorData.deliveryDate))
      : 0;

    try {
      const submittedData = {
        ...distributorData,
        pickupDate: pickupTimestamp,
        deliveryDate: deliveryTimestamp,
        distributorId: parseInt(distributorData.distributorId) || 1,
      };

      const receipt = await blockchain.addDistributorDetails(selectedBatchId, submittedData);
      console.log("Distributor details added", receipt);
      setSuccessMessage("✅ Distributor details added successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🚚 Distributor Dashboard</h1>
        <div className="account-info">
          <strong>Wallet Address:</strong>
          <code>{account || "Not connected"}</code>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="batch-selector">
        <label>📦 Select Batch to Work With</label>
        <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
          <option value="">-- Select a batch --</option>
          {allBatches.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        {batchInfo && (
          <div className="batch-info">
            Remaining: <strong>{batchInfo.remainingQuantity.toString()}</strong> {batchInfo.unit}
          </div>
        )}
      </div>

      {selectedBatchId && (
        <>
          <form onSubmit={handlePurchaseBatch}>
            <div className="form-section">
              <h2 className="form-section-title">Purchase Batch</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Quantity to Purchase</label>
                  <input
                    type="number"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                    placeholder="500"
                    min="1"
                    max={batchInfo ? batchInfo.remainingQuantity : undefined}
                    required
                  />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Processing..." : "✅ Purchase Batch"}
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={handleAddDistributorDetails}>
            <div className="form-section">
              <h2 className="form-section-title">Distribution Details</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={distributorData.companyName}
                    onChange={handleInputChange}
                    placeholder="Logistics Co."
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Company Address</label>
                  <input
                    type="text"
                    name="companyAddressFull"
                    value={distributorData.companyAddressFull}
                    onChange={handleInputChange}
                    placeholder="789 Distribution Ave, City"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Transportation</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    name="transportVehicleNumber"
                    value={distributorData.transportVehicleNumber}
                    onChange={handleInputChange}
                    placeholder="MH01AB1234"
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Pickup Date</label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={distributorData.pickupDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={distributorData.deliveryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Storage Conditions</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Storage Temperature</label>
                  <input
                    type="text"
                    name="storageTemperature"
                    value={distributorData.storageTemperature}
                    onChange={handleInputChange}
                    placeholder="4-8°C"
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Warehouse Location</label>
                  <input
                    type="text"
                    name="warehouseLocation"
                    value={distributorData.warehouseLocation}
                    onChange={handleInputChange}
                    placeholder="Zone A, Rack 5"
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Quality Check Status</label>
                  <select
                    name="qualityCheckStatus"
                    value={distributorData.qualityCheckStatus}
                    onChange={handleInputChange}
                  >
                    <option value="Good">✅ Good</option>
                    <option value="Fair">⚠️ Fair</option>
                    <option value="Poor">❌ Poor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Processing..." : "💾 Save Details"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
    </>
  );
}
