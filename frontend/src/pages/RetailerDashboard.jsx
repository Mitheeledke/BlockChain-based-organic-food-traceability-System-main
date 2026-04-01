import { useEffect, useState } from "react";
import * as blockchain from "../services/blockchain";
import "../styles/dashboards.css";
import Navbar from "../components/Navbar";

export default function RetailerDashboard() {
  const [account, setAccount] = useState("");
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchInfo, setBatchInfo] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [retailerData, setRetailerData] = useState({
    retailerId: 1,
    storeName: "",
    storeAddressFull: "",
    productReceivedDate: "",
    productExpiryDate: "",
    shelfLifeInDays: 0,
    storageCondition: "Refrigerated",
    retailPricePerKg: 0,
    availabilityStatus: "In Stock",
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
    setRetailerData((prev) => ({
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

  const handleAddRetailerDetails = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedBatchId) {
      setError("Please select a batch");
      return;
    }

    setLoading(true);
    const receivedTimestamp = retailerData.productReceivedDate
      ? blockchain.toTimestamp(new Date(retailerData.productReceivedDate))
      : 0;
    const expiryTimestamp = retailerData.productExpiryDate
      ? blockchain.toTimestamp(new Date(retailerData.productExpiryDate))
      : 0;

    try {
      const submittedData = {
        ...retailerData,
        productReceivedDate: receivedTimestamp,
        productExpiryDate: expiryTimestamp,
        retailerId: parseInt(retailerData.retailerId) || 1,
        shelfLifeInDays: parseInt(retailerData.shelfLifeInDays) || 0,
        retailPricePerKg: parseFloat(retailerData.retailPricePerKg) || 0,
      };

      const receipt = await blockchain.addRetailerDetails(selectedBatchId, submittedData);
      console.log("Retailer details added", receipt);
      setSuccessMessage("✅ Retailer details added successfully");
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
        <h1>🏪 Retailer Dashboard</h1>
        <div className="account-info">
          <strong>Wallet Address:</strong>
          <code>{account || "Not connected"}</code>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="batch-selector">
        <label>📦 Select Batch to buy from farmer</label>
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
                    placeholder="200"
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

          <form onSubmit={handleAddRetailerDetails}>
            <div className="form-section">
              <h2 className="form-section-title">Store Information</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Store Name</label>
                  <input
                    type="text"
                    name="storeName"
                    value={retailerData.storeName}
                    onChange={handleInputChange}
                    placeholder="Fresh Mart, Organic Store"
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Store Address</label>
                  <input
                    type="text"
                    name="storeAddressFull"
                    value={retailerData.storeAddressFull}
                    onChange={handleInputChange}
                    placeholder="456 Shop Street, Downtown"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Product Timeline</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Product Received Date</label>
                  <input
                    type="date"
                    name="productReceivedDate"
                    value={retailerData.productReceivedDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Product Expiry Date</label>
                  <input
                    type="date"
                    name="productExpiryDate"
                    value={retailerData.productExpiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Shelf Life (Days)</label>
                  <input
                    type="number"
                    name="shelfLifeInDays"
                    value={retailerData.shelfLifeInDays}
                    onChange={handleInputChange}
                    placeholder="30"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Storage & Pricing</h2>
              <div className="form-grid">
                <div className="form-group required">
                  <label>Storage Condition</label>
                  <select
                    name="storageCondition"
                    value={retailerData.storageCondition}
                    onChange={handleInputChange}
                  >
                    <option value="Refrigerated">❄️ Refrigerated</option>
                    <option value="Room Temperature">🌡️ Room Temperature</option>
                    <option value="Frozen">🧊 Frozen</option>
                    <option value="Ambient">💨 Ambient</option>
                  </select>
                </div>
                <div className="form-group required">
                  <label>Retail Price (per Kg)</label>
                  <input
                    type="number"
                    name="retailPricePerKg"
                    value={retailerData.retailPricePerKg}
                    onChange={handleInputChange}
                    placeholder="250.50"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group required">
                  <label>Availability Status</label>
                  <select
                    name="availabilityStatus"
                    value={retailerData.availabilityStatus}
                    onChange={handleInputChange}
                  >
                    <option value="In Stock">✅ In Stock</option>
                    <option value="Low Stock">⚠️ Low Stock</option>
                    <option value="Out of Stock">❌ Out of Stock</option>
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
