# Frontend Services API Reference

## Quick Start

### Initialize Services in Your Component

```javascript
import { login, setAuthToken } from "../services/api";
import * as blockchain from "../services/blockchain";

// Login user
const response = await login({ email, password });
setAuthToken(response.data.token);

// Connect wallet
await blockchain.connectWallet();
```

---

## API Service (`api.js`)

### Authentication

#### `login({ email, password })`
Login user and receive JWT token.
```javascript
const response = await login({ 
  email: "user@example.com", 
  password: "password123" 
});
const { token } = response.data;
setAuthToken(token);
localStorage.setItem("token", token);
```

#### `registerUser({ name, email, password, role, wallet_address })`
Register new user.
```javascript
const response = await registerUser({
  name: "John Doe",
  email: "john@example.com",
  password: "pass123",
  role: "Farmer", // or "Distributor", "Retailer", "Admin"
  wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e1"
});
```

#### `fetchProfile()`
Get current user profile (requires token).
```javascript
const response = await fetchProfile();
const { id, name, email, role, wallet_address } = response.data;
```

#### `setAuthToken(token)`
Set authorization header for all future requests.
```javascript
setAuthToken(token);
// Now all API calls include Authorization: Bearer <token>
```

---

## Blockchain Service (`blockchain.js`)

### Wallet Management

#### `connectWallet()`
Request user to connect MetaMask wallet.
```javascript
const signer = await blockchain.connectWallet();
// MetaMask popup appears, user confirms connection
```

#### `getCurrentAccount()`
Get currently connected wallet address.
```javascript
const account = await blockchain.getCurrentAccount();
console.log(account); // "0x742d35..."
```

---

### Batch Operations (Write)

#### `createFarmerBatch(farmerData, totalQuantity, unit)`
Create initial product batch by farmer.

**Parameters:**
```javascript
const farmerData = {
  farmerId: 0,                              // uint
  farmerName: "Green Farm",                 // string
  farmAddressFull: "123 Farm Lane",         // string
  gpsCoordinates: "40.7128,-74.0060",      // string
  farmAreaInAcres: 50,                      // uint
  cropName: "Tomatoes",                     // string
  cropVariety: "Cherry Tomato",            // string
  seedSource: "Certified Organic",          // string
  sowingDate: 1677456000,                   // uint (unix timestamp)
  harvestDate: 1680134400,                  // uint (unix timestamp)
  organicCertificationAuthority: "USDA",   // string
  certificationNumber: "ORG123456",         // string
  certificationExpiryDate: 1708992000      // uint (unix timestamp)
};

const batchId = await blockchain.createFarmerBatch(
  farmerData, 
  1000,      // totalQuantity
  "kg"       // unit
);
// Returns: "B1" (or next sequential ID)
```

#### `purchaseBatch(parentBatchId, quantity)`
Purchase/split a batch. Creates child batch for buyer.

**Parameters:**
```javascript
const newBatchId = await blockchain.purchaseBatch(
  "B1",      // parent batch ID
  500        // quantity to purchase
);
// Returns: "B1-1" (parent-sequenceNumber)
```

#### `addDistributorDetails(batchId, distributorData)`
Add distribution information to a batch (only batch owner).

**Parameters:**
```javascript
const distributorData = {
  distributorId: 0,                         // uint
  companyName: "Green Logistics",           // string
  companyAddressFull: "456 Distribution",   // string
  transportVehicleNumber: "VEH-001",        // string
  pickupDate: 1677542400,                   // uint (unix timestamp)
  deliveryDate: 1677628800,                 // uint (unix timestamp)
  storageTemperature: "-5°C",               // string
  warehouseLocation: "Warehouse A, Zone 2", // string
  qualityCheckStatus: "Good"                // string
};

await blockchain.addDistributorDetails("B1-1", distributorData);
// No return; emits DistributorDetailsAdded event
```

#### `addRetailerDetails(batchId, retailerData)`
Add retail information to a batch (only batch owner).

**Parameters:**
```javascript
const retailerData = {
  retailerId: 0,                            // uint
  storeName: "Organic Market",              // string
  storeAddressFull: "789 Market Street",    // string
  productReceivedDate: 1677715200,          // uint (unix timestamp)
  productExpiryDate: 1678320000,            // uint (unix timestamp)
  shelfLifeInDays: 7,                       // uint
  storageCondition: "Refrigerated",         // string ("Refrigerated", "Room Temperature", "Frozen")
  retailPricePerKg: 8.99,                   // uint (in cents or smallest unit)
  availabilityStatus: "In Stock"            // string
};

await blockchain.addRetailerDetails("B1-1-1", retailerData);
// No return; emits RetailerDetailsAdded event
```

---

### Batch Queries (Read-Only)

#### `getBatch(batchId)`
Get detailed information about a specific batch.

**Returns:**
```javascript
const batch = await blockchain.getBatch("B1");
// {
//   batchId: "B1",
//   parentBatchId: "",
//   owner: "0x742d35...",
//   totalQuantity: 1000,
//   remainingQuantity: 500,
//   unit: "kg",
//   timestamp: 1677456000,
//   exists: true
// }
```

#### `getChildBatches(batchId)`
Get all child batches created from a parent batch.

**Returns:**
```javascript
const children = await blockchain.getChildBatches("B1");
// ["B1-1", "B1-2", "B1-3"]
```

#### `getAllBatchIds()`
Get all batch IDs ever created on contract.

**Returns:**
```javascript
const allIds = await blockchain.getAllBatchIds();
// ["B1", "B2", "B1-1", "B1-1-1", "B2-1", ...]
```

---

### Utility Functions

#### `toTimestamp(date)`
Convert JavaScript Date or date string to Unix timestamp (seconds).

**Parameters:**
```javascript
const timestamp1 = blockchain.toTimestamp(new Date());
// Returns: 1677456000

const timestamp2 = blockchain.toTimestamp("2023-03-01");
// Returns: 1677542400

const timestamp3 = blockchain.toTimestamp("2023-03-01T12:00:00");
// Returns: 1677584400
```

---

### Event Listeners

#### `subscribeToEvents(callback)`
Listen for contract events in real-time.

**Callback receives:**
```javascript
blockchain.subscribeToEvents((event) => {
  if (event.type === "BatchCreated") {
    console.log(`New batch: ${event.batchId} by ${event.owner}`);
  }
  if (event.type === "BatchPurchased") {
    console.log(`Batch ${event.parentId} split to ${event.newBatchId} by ${event.buyer}`);
  }
  if (event.type === "DistributorDetailsAdded") {
    console.log(`Distributor info added to ${event.batchId}`);
  }
  if (event.type === "RetailerDetailsAdded") {
    console.log(`Retailer info added to ${event.batchId}`);
  }
});
```

#### `unsubscribeFromEvents()`
Stop listening for events.

```javascript
blockchain.unsubscribeFromEvents();
```

---

## Complete Example: Farmer to Consumer Flow

### 1. Farmer Creates Batch

```javascript
import * as blockchain from "../services/blockchain";
import { blockchain } from "../services/blockchain";

// Connect wallet
await blockchain.connectWallet();

// Prepare farmer data
const farmerData = {
  farmerId: 1,
  farmerName: "John's Organic Farm",
  farmAddressFull: "123 Farm Road, California",
  gpsCoordinates: "34.0522,-118.2437",
  farmAreaInAcres: 100,
  cropName: "Tomatoes",
  cropVariety: "Heirloom Red",
  seedSource: "Certified Organic Seeds Inc.",
  sowingDate: blockchain.toTimestamp("2023-04-01"),
  harvestDate: blockchain.toTimestamp("2023-07-15"),
  organicCertificationAuthority: "USDA Organic",
  certificationNumber: "USDA-ORG-2023-12345",
  certificationExpiryDate: blockchain.toTimestamp("2024-12-31")
};

// Create batch
const batchId = await blockchain.createFarmerBatch(farmerData, 5000, "kg");
console.log(`Batch created: ${batchId}`); // "B1"

// Share batchId with distributors
```

### 2. Distributor Purchases and Adds Details

```javascript
// Distributor logs in and connects wallet
await blockchain.connectWallet();

// Purchase 2000 kg from farmer's batch
const distributorBatchId = await blockchain.purchaseBatch("B1", 2000);
// Returns: "B1-1"

// Add distributor details
const distributorData = {
  distributorId: 1,
  companyName: "Fresh Foods Distribution",
  companyAddressFull: "456 Warehouse Way, Nevada",
  transportVehicleNumber: "FFD-TRUCK-001",
  pickupDate: blockchain.toTimestamp("2023-07-16"),
  deliveryDate: blockchain.toTimestamp("2023-07-18"),
  storageTemperature: "2-4°C (Refrigerated)",
  warehouseLocation: "Las Vegas DC, Bay 5",
  qualityCheckStatus: "Excellent"
};

await blockchain.addDistributorDetails("B1-1", distributorData);
```

### 3. Retailer Purchases and Adds Details

```javascript
// Retailer connects wallet
await blockchain.connectWallet();

// Purchase 500 kg from distributor
const retailerBatchId = await blockchain.purchaseBatch("B1-1", 500);
// Returns: "B1-1-1"

// Add retail details
const retailerData = {
  retailerId: 1,
  storeName: "Whole Foods Market - Downtown LA",
  storeAddressFull: "789 Main Street, Los Angeles",
  productReceivedDate: blockchain.toTimestamp("2023-07-19"),
  productExpiryDate: blockchain.toTimestamp("2023-07-26"),
  shelfLifeInDays: 7,
  storageCondition: "Refrigerated (4°C)",
  retailPricePerKg: 12.99,
  availabilityStatus: "In Stock - Fresh"
};

await blockchain.addRetailerDetails("B1-1-1", retailerData);
```

### 4. Consumer Traces Product

```javascript
// Consumer (no login needed) scans QR code: "B1-1-1"

// Get final batch info
const batch = await blockchain.getBatch("B1-1-1");
console.log(`Product Owner (Retailer): ${batch.owner}`);
console.log(`Price: ${batch.price}/kg`);

// Trace back through supply chain
const traceFunction = async (batchId, depth = 0) => {
  const batch = await blockchain.getBatch(batchId);
  console.log(`${"  ".repeat(depth)}├─ Batch: ${batchId}`);
  console.log(`${"  ".repeat(depth)}├─ Owner: ${batch.owner}`);
  console.log(`${"  ".repeat(depth)}├─ Qty: ${batch.totalQuantity} ${batch.unit}`);
  
  if (batch.parentBatchId) {
    await traceFunction(batch.parentBatchId, depth + 1);
  }
};

await traceFunction("B1-1-1");
// Output:
// ├─ Batch: B1-1-1 (Retailer)
//   ├─ Batch: B1-1 (Distributor)
//     ├─ Batch: B1 (Farmer)
```

---

## Error Handling

All functions may throw errors. Always use try-catch:

```javascript
try {
  const batch = await blockchain.getBatch(batchId);
} catch (error) {
  if (error.message.includes("Batch not found")) {
    console.error("Invalid batch ID");
  } else if (error.message.includes("User rejected")) {
    console.error("User denied MetaMask request");
  } else {
    console.error("Unknown error:", error.message);
  }
}
```

---

## Contract Requirements

- MetaMask installed and configured
- Connected to valid Ethereum network (Ganache/Testnet/Mainnet)
- Smart contract deployed with valid ABI
- Contract address set in environment variables
- Sufficient gas for transactions

---

## Common Data Patterns

### Timestamp Format
All dates in contract are **Unix timestamps (seconds since epoch)**:
```javascript
// ✓ Correct
const ts = blockchain.toTimestamp("2023-03-15"); // 1678876800

// ✗ Wrong
const ts = Date.now(); // milliseconds, not seconds!
```

### Batch ID Format
Batch IDs follow pattern: `B<number>` or `Parent-<number>`:
```javascript
"B1"      // First batch (farmer)
"B1-1"    // First child of B1 (distributor)
"B1-1-1"  // First child of B1-1 (retailer)
"B1-1-2"  // Second child of B1-1 (another retailer)
"B2"      // Second root batch (different farmer)
```

### Wallet Address Format
MetaMask addresses are 42 characters starting with `0x`:
```javascript
"0x742d35Cc6634C0532925a3b844Bc9e7595f42e1"
```

---

## Testing Checklist

- [ ] MetaMask installed
- [ ] Connected to correct network
- [ ] Contract address in .env
- [ ] Backend running on port 5000
- [ ] JWT token set after login
- [ ] Wallet connected (button shows address)
- [ ] Can create batch
- [ ] Can purchase batch
- [ ] Can add details
- [ ] Can view batch trace
