import { useRef, useState } from "react";
import jsQR from "jsqr";
import * as blockchain from "../services/blockchain";
import { makeIpfsUrl } from "../services/ipfs";
import "../styles/dashboards.css";
import "../styles/consumer.css";
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
  const [scanError, setScanError] = useState(null);
  const canvasRef = useRef(null);


  const extractBatchIdFromQrText = (text) => {
    if (!text) return null;
    const trimmed = text.trim();

    try {
      const url = new URL(trimmed);
      const params = new URLSearchParams(url.search);
      return (params.get("batchId") || params.get("batch") || url.pathname.split("/").pop() || trimmed)
        .toString()
        .trim()
        .toUpperCase();
    } catch {
      const queryMatch = trimmed.match(/(?:batchId|batch)=([A-Za-z0-9\-]+)/i);
      if (queryMatch) return queryMatch[1].toUpperCase();
      const idMatch = trimmed.match(/([A-Za-z0-9][A-Za-z0-9\-]*)/);
      return idMatch ? idMatch[1].toUpperCase() : trimmed.toUpperCase();
    }
  };

  const decodeCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    return code?.data || null;
  };

  const handleQrResult = async (text) => {
    const extracted = extractBatchIdFromQrText(text);
    if (!extracted) {
      throw new Error("Unable to extract batch ID from QR code.");
    }
    setBatchId(extracted);
    await handleTraceById(extracted);
  };

  const handleTraceById = async (queryBatchId) => {
    setLoading(true);
    setError(null);
    setTraceData(null);

    try {
      const normalizedBatchId = queryBatchId.trim().toUpperCase();
      if (!normalizedBatchId) {
        throw new Error("Please enter a valid batch ID.");
      }

      const batchesInPath = [];
      const visited = new Set();
      let currentBatchId = normalizedBatchId;

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

  const handleTrace = async (e) => {
    e.preventDefault();
    await handleTraceById(batchId);
  };

  const handleQrFile = async (event) => {
    setScanError(null);
    setTraceData(null);
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (loadEvent) => {
        const image = new Image();
        image.onload = async () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const decoded = decodeCanvasImage();
          if (decoded) {
            await handleQrResult(decoded);
          } else {
            setScanError("QR code was not detected in the uploaded image.");
          }
        };
        image.onerror = () => {
          setScanError("Could not read the QR image file.");
        };
        image.src = loadEvent.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setScanError("Failed to read the selected file.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="consumer-container">
        <div className="consumer-header">
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

            <div className="consumer-file-actions">
              <label className="consumer-upload-label">
                Upload QR Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFile}
                  style={{ display: "none" }}
                />
              </label>
              <div className="consumer-upload-note">
                Choose a saved QR code image to extract the batch ID and display product trace details.
              </div>
            </div>

            {scanError && <div className="error-box">{scanError}</div>}

            <div className="button-group" style={{ marginTop: "18px" }}>
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

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {error && <div className="error-box">{error}</div>}

        {traceData && (
          <div className="consumer-result-card">
            <div className="trace-section trace-top-card">
              <div className="trace-top-main">
                <div>
                  <h2 className="trace-heading">Organic Traceability Certificate</h2>
                  <p className="trace-note">
                    Verified product journey for batch <strong>{traceData.queryBatchId}</strong>.
                  </p>
                </div>
                <div className="trace-photo-card">
                  <img
                    src={
                      traceData.batch.productPhotoHash
                        ? makeIpfsUrl(traceData.batch.productPhotoHash)
                        : "https://via.placeholder.com/420x260?text=Organic+Product+Photo"
                    }
                    alt="Product trace photo"
                    className="trace-photo"
                  />
                </div>
              </div>

              <div className="trace-grid">
                <div className="trace-card">
                  <span className="trace-label">Verification Status</span>
                  <span className="trace-value">AUTHENTIC</span>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Batch Date</span>
                  <span className="trace-value">
                    {new Date(Number(traceData.batch.timestamp) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Quantity</span>
                  <span className="trace-value">
                    {traceData.batch.totalQuantity} {traceData.batch.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="trace-section">
              <h3 className="trace-section-title">Proof & IPFS Images</h3>
              <div className="image-gallery">
                <div className="image-card">
                  <span className="trace-label">Product Photo</span>
                  <img
                    src={
                      traceData.batch.productPhotoHash
                        ? makeIpfsUrl(traceData.batch.productPhotoHash)
                        : "https://via.placeholder.com/320x200?text=No+Image"
                    }
                    alt="Product photo"
                    className="trace-image-preview"
                  />
                  <a
                    className="trace-link"
                    href={
                      traceData.batch.productPhotoHash
                        ? makeIpfsUrl(traceData.batch.productPhotoHash)
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {traceData.batch.productPhotoHash
                      ? "Open IPFS Product Image"
                      : "Product image not available"}
                  </a>
                </div>
                <div className="image-card">
                  <span className="trace-label">Farm Photo</span>
                  <img
                    src={
                      traceData.farmerData?.farmPhotoHash
                        ? makeIpfsUrl(traceData.farmerData.farmPhotoHash)
                        : "https://via.placeholder.com/320x200?text=No+Image"
                    }
                    alt="Farm photo"
                    className="trace-image-preview"
                  />
                  <a
                    className="trace-link"
                    href={
                      traceData.farmerData?.farmPhotoHash
                        ? makeIpfsUrl(traceData.farmerData.farmPhotoHash)
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {traceData.farmerData?.farmPhotoHash
                      ? "Open IPFS Farm Image"
                      : "Farm image not available"}
                  </a>
                </div>
                <div className="image-card">
                  <span className="trace-label">Transit Photo</span>
                  <img
                    src={
                      traceData.distributorData?.transitPhotoHash
                        ? makeIpfsUrl(traceData.distributorData.transitPhotoHash)
                        : "https://via.placeholder.com/320x200?text=No+Image"
                    }
                    alt="Transit photo"
                    className="trace-image-preview"
                  />
                  <a
                    className="trace-link"
                    href={
                      traceData.distributorData?.transitPhotoHash
                        ? makeIpfsUrl(traceData.distributorData.transitPhotoHash)
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {traceData.distributorData?.transitPhotoHash
                      ? "Open IPFS Transit Image"
                      : "Transit image not available"}
                  </a>
                </div>
              </div>

              <div className="trace-card certification-proof-card">
                <span className="trace-label">Certification Authority</span>
                <span className="trace-value">
                  {traceData.farmerData?.organicCertificationAuthority || "-"}
                </span>
                <span className="trace-label">Certification Number</span>
                <span className="trace-value">
                  {traceData.farmerData?.certificationNumber || "-"}
                </span>
                <span className="trace-label">Certification Proof</span>
                <span className="trace-value">
                  {traceData.farmerData?.organicCertificationAuthority
                    ? "Organic certification is recorded on-chain and verifiable by the issuing authority."
                    : "Certification proof not available."}
                </span>
              </div>
            </div>
            <div className="trace-section">
              <h3 className="trace-section-title">Farmer & Crop Details</h3>
              <div className="trace-row">
                <div className="trace-card">
                  <span className="trace-label">Farmer Name</span>
                  <span className="trace-value">{traceData.farmerData?.farmerName || "-"}</span>
                  <span className="trace-label">Farm Address</span>
                  <span className="trace-value">{traceData.farmerData?.farmAddressFull || "-"}</span>
                  <span className="trace-label">Farm GPS</span>
                  <span className="trace-value">{traceData.farmerData?.gpsCoordinates || "-"}</span>
                  <span className="trace-label">Farm Area</span>
                  <span className="trace-value">{traceData.farmerData?.farmAreaInAcres || "-"} acres</span>
                  <span className="trace-label">Soil Health</span>
                  <span className="trace-value">{traceData.farmerData?.soilHealthStatus || "-"}</span>
                  <span className="trace-label">Fertilizer Used</span>
                  <span className="trace-value">{traceData.farmerData?.fertilizerUsed || "-"}</span>
                  {traceData.farmerData?.farmPhotoHash && (
                    <>
                      <span className="trace-label">Farm Photo</span>
                      <a
                        className="trace-value trace-link"
                        href={makeIpfsUrl(traceData.farmerData.farmPhotoHash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Photo
                      </a>
                    </>
                  )}
                </div>
                <div className="trace-card">
                  <span className="trace-label">Crop</span>
                  <span className="trace-value">{traceData.farmerData?.cropName || "-"}</span>
                  <span className="trace-label">Variety</span>
                  <span className="trace-value">{traceData.farmerData?.cropVariety || "-"}</span>
                  <span className="trace-label">Seed Source</span>
                  <span className="trace-value">{traceData.farmerData?.seedSource || "-"}</span>
                  <span className="trace-label">Source Batch</span>
                  <span className="trace-value">{traceData.farmerBatchId || "-"}</span>
                </div>
              </div>
            </div>

            <div className="trace-section">
              <h3 className="trace-section-title">Organic Certification</h3>
              <div className="trace-grid">
                <div className="trace-card">
                  <span className="trace-label">Authority</span>
                  <span className="trace-value">
                    {traceData.farmerData?.organicCertificationAuthority || "-"}
                  </span>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Certification #</span>
                  <span className="trace-value">{traceData.farmerData?.certificationNumber || "-"}</span>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Valid Until</span>
                  <span className="trace-value">
                    {traceData.farmerData?.certificationExpiryDate
                      ? new Date(Number(traceData.farmerData.certificationExpiryDate) * 1000).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="trace-section">
              <h3 className="trace-section-title">Cultivation Timeline</h3>
              <div className="trace-grid">
                <div className="trace-card">
                  <span className="trace-label">Sown</span>
                  <span className="trace-value">
                    {traceData.farmerData?.sowingDate
                      ? new Date(Number(traceData.farmerData.sowingDate) * 1000).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Harvested</span>
                  <span className="trace-value">
                    {traceData.farmerData?.harvestDate
                      ? new Date(Number(traceData.farmerData.harvestDate) * 1000).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {traceData.distributorData && Number(traceData.distributorData.distributorId) > 0 && (
              <div className="trace-section">
                <h3 className="trace-section-title">Distributor Details</h3>
                <div className="trace-row">
                  <div className="trace-card">
                    <span className="trace-label">Company</span>
                    <span className="trace-value">{traceData.distributorData.companyName || "-"}</span>
                    <span className="trace-label">Address</span>
                    <span className="trace-value">{traceData.distributorData.companyAddressFull || "-"}</span>
                    <span className="trace-label">Vehicle</span>
                    <span className="trace-value">{traceData.distributorData.transportVehicleNumber || "-"}</span>
                    <span className="trace-label">Transport Type</span>
                    <span className="trace-value">{traceData.distributorData.vehicleType || "-"}</span>
                    <span className="trace-label">License No.</span>
                    <span className="trace-value">{traceData.distributorData.distributorLicenseNum || "-"}</span>
                  </div>
                  <div className="trace-card">
                    <span className="trace-label">Pickup</span>
                    <span className="trace-value">
                      {traceData.distributorData.pickupDate
                        ? new Date(Number(traceData.distributorData.pickupDate) * 1000).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="trace-label">Delivery</span>
                    <span className="trace-value">
                      {traceData.distributorData.deliveryDate
                        ? new Date(Number(traceData.distributorData.deliveryDate) * 1000).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="trace-label">Temperature</span>
                    <span className="trace-value">
                      {traceData.distributorData.transportTempCelsius !== undefined
                        ? `${traceData.distributorData.transportTempCelsius}°C`
                        : "-"}
                    </span>
                    <span className="trace-label">Humidity</span>
                    <span className="trace-value">
                      {traceData.distributorData.humidityLevel !== undefined
                        ? `${traceData.distributorData.humidityLevel}%`
                        : "-"}
                    </span>
                    {traceData.distributorData.transitPhotoHash && (
                      <>
                        <span className="trace-label">Transit Photo</span>
                        <a
                          className="trace-value trace-link"
                          href={makeIpfsUrl(traceData.distributorData.transitPhotoHash)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Photo
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {traceData.retailerData && Number(traceData.retailerData.retailerId) > 0 && (
              <div className="trace-section">
                <h3 className="trace-section-title">Retailer Details</h3>
                <div className="trace-row">
                  <div className="trace-card">
                    <span className="trace-label">Store Name</span>
                    <span className="trace-value">{traceData.retailerData.storeName || "-"}</span>
                    <span className="trace-label">Address</span>
                    <span className="trace-value">{traceData.retailerData.storeAddressFull || "-"}</span>
                  </div>
                  <div className="trace-card">
                    <span className="trace-label">Received</span>
                    <span className="trace-value">
                      {traceData.retailerData.productReceivedDate
                        ? new Date(Number(traceData.retailerData.productReceivedDate) * 1000).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="trace-label">Expiry Date</span>
                    <span className="trace-value">
                      {traceData.retailerData.productExpiryDate
                        ? new Date(Number(traceData.retailerData.productExpiryDate) * 1000).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="trace-label">Storage Condition</span>
                    <span className="trace-value">{traceData.retailerData.storageCondition || "-"}</span>
                    <span className="trace-label">Retailer License</span>
                    <span className="trace-value">{traceData.retailerData.retailerLicenseNum || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="trace-section trace-note-box">
              <strong>Verified on Blockchain:</strong> All farmer information, crop details, and organic certification are permanently recorded and cannot be modified.
            </div>

            {traceData.tracePath?.length > 0 && (
              <div className="trace-section">
                <h3 className="trace-section-title">Trace Path</h3>
                <p className="trace-value trace-path">{traceData.tracePath.join(" -> ")}</p>
              </div>
            )}

            {traceData.children?.length > 0 ? (
              <div className="trace-section">
                <h3 className="trace-section-title">Distribution Chain</h3>
                <div className="trace-grid">
                  {traceData.children.map((child, index) => (
                    <div key={child} className="trace-card trace-chain-card">
                      <span className="trace-label">Step {index + 1}</span>
                      <span className="trace-value">{child}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="trace-section trace-note-box">
                This is the final visible batch. No downstream sales found.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
