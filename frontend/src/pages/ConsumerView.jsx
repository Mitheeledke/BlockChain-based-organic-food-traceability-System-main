import { useState } from "react";
import * as blockchain from "../services/blockchain";
import "../styles/dashboards.css";
import Navbar from "../components/Navbar";

const hasFarmerDetails = (data) =>
  Boolean(data && (Number(data.farmerId) > 0 || data.farmerName || data.cropName));

const hasDistributorDetails = (data) =>
  Boolean(
    data &&
      (Number(data.distributorId) > 0 || data.companyName || data.transportVehicleNumber)
  );

const hasRetailerDetails = (data) =>
  Boolean(data && (Number(data.retailerId) > 0 || data.storeName || data.availabilityStatus));

export default function ConsumerView() {
  const [batchId, setBatchId] = useState("");
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrace = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTraceData(null);

    try {
      const normalizedBatchId = batchId.trim().toUpperCase();
      if (!normalizedBatchId) {
        throw new Error("Please enter a valid batch ID.");
      }

      const batchesInPath = [];
      const visited = new Set();
      let currentBatchId = normalizedBatchId;

      // Walk from the entered batch to the root batch.
      while (currentBatchId && !visited.has(currentBatchId)) {
        visited.add(currentBatchId);
        const batch = await blockchain.getBatch(currentBatchId);
        batchesInPath.push(batch);
        currentBatchId = batch.parentBatchId;
      }

      if (batchesInPath.length === 0) {
        throw new Error("Batch not found. Please check the Batch ID.");
      }

      const detailEntries = await Promise.all(
        batchesInPath.map(async (batch) => {
          const [farmerData, distributorData, retailerData] = await Promise.all([
            blockchain.getFarmerDetails(batch.batchId),
            blockchain.getDistributorDetails(batch.batchId),
            blockchain.getRetailerDetails(batch.batchId),
          ]);

          return {
            batchId: batch.batchId,
            farmerData,
            distributorData,
            retailerData,
          };
        })
      );

      const farmerEntry = [...detailEntries]
        .reverse()
        .find((entry) => hasFarmerDetails(entry.farmerData));
      const distributorEntry = detailEntries.find((entry) =>
        hasDistributorDetails(entry.distributorData)
      );
      const retailerEntry = detailEntries.find((entry) =>
        hasRetailerDetails(entry.retailerData)
      );
      const farmerBatch = farmerEntry
        ? batchesInPath.find((batch) => batch.batchId === farmerEntry.batchId)
        : null;
      const distributorBatch = distributorEntry
        ? batchesInPath.find((batch) => batch.batchId === distributorEntry.batchId)
        : null;
      const retailerBatch = retailerEntry
        ? batchesInPath.find((batch) => batch.batchId === retailerEntry.batchId)
        : null;
      const childBatches = await blockchain.getChildBatches(normalizedBatchId);

      setTraceData({
        queryBatchId: normalizedBatchId,
        batch: batchesInPath[0],
        tracePath: [...batchesInPath].reverse().map((batch) => batch.batchId),
        children: childBatches,
        farmerData: farmerEntry?.farmerData || null,
        farmerBatchId: farmerEntry?.batchId || null,
        farmerOwner: farmerBatch?.owner || null,
        distributorData: distributorEntry?.distributorData || null,
        distributorBatchId: distributorEntry?.batchId || null,
        distributorOwner: distributorBatch?.owner || null,
        retailerData: retailerEntry?.retailerData || null,
        retailerBatchId: retailerEntry?.batchId || null,
        retailerOwner: retailerBatch?.owner || null,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Batch not found. Please check the Batch ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Food Traceability Lookup</h1>
          <p style={{ marginTop: "10px", color: "#666", fontSize: "1.1em" }}>
            Access complete supply chain information by entering the product batch ID.
          </p>
        </div>

        <form onSubmit={handleTrace}>
          <div className="form-section">
            <h2 className="form-section-title">Enter or Scan Batch ID</h2>
            <div className="form-grid">
              <div className="form-group required form-group-full">
                <label>Batch ID (from QR code or product label)</label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g., B1 or B10-11-12"
                  required
                  style={{ fontSize: "1.1em", padding: "14px" }}
                />
              </div>
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading" /> Searching...
                  </>
                ) : (
                  "Trace Product"
                )}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="error-box">{error}</div>}

        {traceData && (
          <div className="batch-details">
            <h2
              style={{
                color: "#667eea",
                marginTop: 0,
                marginBottom: "25px",
                fontSize: "1.5em",
              }}
            >
              Product Trace: {traceData.queryBatchId}
            </h2>

            <div
              className="form-section"
              style={{ background: "#f0f9ff", borderLeft: "4px solid #48bb78" }}
            >
              <h2 className="form-section-title" style={{ color: "#2d5016" }}>
                Organic Certification Proof
              </h2>
              <p style={{ color: "#555", fontSize: "0.95em" }}>
                Complete supply chain records verified on blockchain.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                    Batch Details
                  </h3>
                  <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                    <p>
                      <strong>Batch ID:</strong> {traceData.batch.batchId}
                    </p>
                    <p>
                      <strong>Total Quantity:</strong> {traceData.batch.totalQuantity}{" "}
                      {traceData.batch.unit}
                    </p>
                    <p>
                      <strong>Remaining Stock:</strong> {traceData.batch.remainingQuantity}{" "}
                      {traceData.batch.unit}
                    </p>
                    <p>
                      <strong>Created On:</strong>{" "}
                      {new Date(Number(traceData.batch.timestamp) * 1000).toLocaleString()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="status-badge success" style={{ marginTop: "4px" }}>
                        AUTHENTIC
                      </span>
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                    Farmer Information
                  </h3>
                  <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                    <p>
                      <strong>Farmer Name:</strong> {traceData.farmerData?.farmerName || "-"}
                    </p>
                    <p>
                      <strong>Farm Address:</strong>{" "}
                      {traceData.farmerData?.farmAddressFull || "-"}
                    </p>
                    <p>
                      <strong>Farm GPS:</strong> {traceData.farmerData?.gpsCoordinates || "-"}
                    </p>
                    <p>
                      <strong>Farm Area:</strong>{" "}
                      {traceData.farmerData?.farmAreaInAcres || "-"} acres
                    </p>
                    <p>
                      <strong>Source Batch:</strong> {traceData.farmerBatchId || "-"}
                    </p>
                    <p>
                      <strong>Wallet:</strong>
                      <br />
                      <code style={{ fontSize: "0.75em", wordBreak: "break-all" }}>
                        {traceData.farmerOwner || "-"}
                      </code>
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                    Crop Information
                  </h3>
                  <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                    <p>
                      <strong>Crop:</strong> {traceData.farmerData?.cropName || "-"}
                    </p>
                    <p>
                      <strong>Variety:</strong> {traceData.farmerData?.cropVariety || "-"}
                    </p>
                    <p>
                      <strong>Seed Source:</strong> {traceData.farmerData?.seedSource || "-"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#48bb78", fontSize: "1.1em" }}>
                    Organic Certification
                  </h3>
                  <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                    <p>
                      <strong>Authority:</strong>{" "}
                      {traceData.farmerData?.organicCertificationAuthority || "-"}
                    </p>
                    <p>
                      <strong>Cert #:</strong>{" "}
                      {traceData.farmerData?.certificationNumber || "-"}
                    </p>
                    <p>
                      <strong>Valid Until:</strong>{" "}
                      {traceData.farmerData?.certificationExpiryDate
                        ? new Date(
                            Number(traceData.farmerData.certificationExpiryDate) * 1000
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                    Cultivation Timeline
                  </h3>
                  <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                    <p>
                      <strong>Farm Name:</strong> {traceData.farmerData?.farmerName || "-"}
                    </p>
                    <p>
                      <strong>Sown:</strong>{" "}
                      {traceData.farmerData?.sowingDate
                        ? new Date(Number(traceData.farmerData.sowingDate) * 1000).toLocaleDateString()
                        : "-"}
                    </p>
                    <p>
                      <strong>Harvested:</strong>{" "}
                      {traceData.farmerData?.harvestDate
                        ? new Date(Number(traceData.farmerData.harvestDate) * 1000).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                {traceData.distributorData && Number(traceData.distributorData.distributorId) > 0 && (
                  <div
                    style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e0",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                      Distributor Details
                    </h3>
                    <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                      <p>
                        <strong>Company:</strong> {traceData.distributorData?.companyName || "-"}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {traceData.distributorData?.companyAddressFull || "-"}
                      </p>
                      <p>
                        <strong>Vehicle #:</strong>{" "}
                        {traceData.distributorData?.transportVehicleNumber || "-"}
                      </p>
                      <p>
                        <strong>Pickup:</strong>{" "}
                        {traceData.distributorData?.pickupDate
                          ? new Date(Number(traceData.distributorData.pickupDate) * 1000).toLocaleDateString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Delivery:</strong>{" "}
                        {traceData.distributorData?.deliveryDate
                          ? new Date(Number(traceData.distributorData.deliveryDate) * 1000).toLocaleDateString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Storage:</strong>{" "}
                        {traceData.distributorData?.storageTemperature || "-"}
                      </p>
                      <p>
                        <strong>Warehouse:</strong>{" "}
                        {traceData.distributorData?.warehouseLocation || "-"}
                      </p>
                      <p>
                        <strong>Quality Check:</strong>{" "}
                        {traceData.distributorData?.qualityCheckStatus || "-"}
                      </p>
                      <p>
                        <strong>Source Batch:</strong> {traceData.distributorBatchId || "-"}
                      </p>
                      <p>
                        <strong>Wallet:</strong>
                        <br />
                        <code style={{ fontSize: "0.75em", wordBreak: "break-all" }}>
                          {traceData.distributorOwner || "-"}
                        </code>
                      </p>
                    </div>
                  </div>
                )}

                {traceData.retailerData && Number(traceData.retailerData.retailerId) > 0 && (
                  <div
                    style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e0",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: "#667eea", fontSize: "1.1em" }}>
                      Retailer Details
                    </h3>
                    <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                      <p>
                        <strong>Store Name:</strong> {traceData.retailerData?.storeName || "-"}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {traceData.retailerData?.storeAddressFull || "-"}
                      </p>
                      <p>
                        <strong>Received:</strong>{" "}
                        {traceData.retailerData?.productReceivedDate
                          ? new Date(
                              Number(traceData.retailerData.productReceivedDate) * 1000
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Expiry Date:</strong>{" "}
                        {traceData.retailerData?.productExpiryDate
                          ? new Date(
                              Number(traceData.retailerData.productExpiryDate) * 1000
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Shelf Life:</strong>{" "}
                        {traceData.retailerData?.shelfLifeInDays || "-"} days
                      </p>
                      <p>
                        <strong>Storage Condition:</strong>{" "}
                        {traceData.retailerData?.storageCondition || "-"}
                      </p>
                      <p>
                        <strong>Price/kg:</strong> $
                        {traceData.retailerData?.retailPricePerKg || "-"}
                      </p>
                      <p>
                        <strong>Availability:</strong>{" "}
                        {traceData.retailerData?.availabilityStatus || "-"}
                      </p>
                      <p>
                        <strong>Source Batch:</strong> {traceData.retailerBatchId || "-"}
                      </p>
                      <p>
                        <strong>Wallet:</strong>
                        <br />
                        <code style={{ fontSize: "0.75em", wordBreak: "break-all" }}>
                          {traceData.retailerOwner || "-"}
                        </code>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  background: "#edf2f7",
                  borderLeft: "3px solid #48bb78",
                  borderRadius: "4px",
                  fontSize: "0.9em",
                  color: "#2d3748",
                }}
              >
                <strong>Verified on Blockchain:</strong> All farmer information, crop details, and
                organic certification are permanently recorded and cannot be modified.
              </div>
            </div>

            {traceData.tracePath && traceData.tracePath.length > 0 && (
              <div className="form-section">
                <h2 className="form-section-title">Trace Path</h2>
                <p style={{ margin: 0, color: "#444", wordBreak: "break-word" }}>
                  {traceData.tracePath.join(" -> ")}
                </p>
              </div>
            )}

            {traceData.children && traceData.children.length > 0 && (
              <div className="form-section">
                <h2 className="form-section-title">
                  Distribution Chain ({traceData.children.length} step
                  {traceData.children.length !== 1 ? "s" : ""})
                </h2>
                <div style={{ display: "grid", gap: "12px" }}>
                  {traceData.children.map((child, index) => (
                    <div
                      key={child}
                      style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #f8f9fa 0%, #e8ecff 100%)",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                      }}
                    >
                      <div
                        style={{
                          background: "#667eea",
                          color: "white",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "1.1em",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#333", fontSize: "1em" }}>{child}</div>
                        <div style={{ fontSize: "0.85em", color: "#666", marginTop: "2px" }}>
                          Downstream batch
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!traceData.children || traceData.children.length === 0) && (
              <div className="info-box">This is the final visible batch. No downstream sales found.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
