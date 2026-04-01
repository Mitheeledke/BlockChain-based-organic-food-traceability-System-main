# Frontend Services Documentation

This guide explains all frontend services and how to use them for the Blockchain Based Food Organic Traceability System.

## Project Flow

```
Farmer creates batch → Distributor purchases & adds details → Retailer purchases & adds details → Consumer scans QR for full trace
```

## Service Architecture

### 1. **api.js** - Backend API Integration
Handles all REST API calls to the backend server (JWT authentication, user management).

**Key Functions:**
- `registerUser(data)` - Register a new user (Farmer, Distributor, Retailer, Admin)
- `login({ email, password })` - User login, returns JWT token
- `fetchProfile()` - Get logged-in user's profile
- `setAuthToken(token)` - Set authorization header for future requests

**Usage:**
```javascript
import { login, setAuthToken } from "../services/api";

const response = await login({ email: "user@example.com", password: "pass123" });
setAuthToken(response.data.token);
localStorage.setItem("token", response.data.token);
```

### 2. **blockchain.js** - Ethereum Smart Contract Integration
Handles all blockchain interactions using ethers.js.

**Key Functions:**

**Wallet & Connection:**
- `connectWallet()` - Connect MetaMask
- `getCurrentAccount()` - Get connected wallet address

**Write Operations (farmers, distributors, retailers):**
- `createFarmerBatch(farmerData, quantity, unit)` - Create initial batch
- `purchaseBatch(parentId, quantity)` - Purchase/split a batch
- `addDistributorDetails(batchId, distributorData)` - Add distributor info
- `addRetailerDetails(batchId, retailerData)` - Add retailer info

**Read Operations (view only, no gas):**
- `getBatch(batchId)` - Get single batch details
- `getChildBatches(batchId)` - Get all child batches
- `getAllBatchIds()` - Get all batch IDs

**Utilities:**
- `toTimestamp(date)` - Convert JS Date to Unix timestamp

**Usage:**
```javascript
import * as blockchain from "../services/blockchain";

await blockchain.connectWallet();
const farmerData = {
  farmerName: "John Doe",
  cropName: "Organic Tomatoes",
  // ... other fields
};
const batchId = await blockchain.createFarmerBatch(farmerData, 1000, "kg");
```

### 3. **contract.js** - Contract Configuration
Stores the smart contract address. Updated via environment variables.

**Setup:**
```
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c93c7D8d02A59136
```

## Component Structure

### ProtectedRoute.jsx
Guards pages that require authentication.
```javascript
<Route path="/farmer" element={
  <ProtectedRoute><FarmerDashboard /></ProtectedRoute>
} />
```

### Navbar.jsx
Navigation bar with login/logout functionality.

## Page Components

### 1. Login.jsx
- User registration/login with email and password
- Stores JWT token in localStorage
- Redirects based on role (Farmer → /farmer, Distributor → /distributor, etc.)

### 2. FarmerDashboard.jsx
**Role:** Create initial product batches
- Connect wallet
- Fill in farmer data (farm name, location, certification details, crop info)
- Create batch with quantity and unit
- Returns batchId for QR code generation

**Key Fields:**
```javascript
{
  farmerId: 0,
  farmerName: "Farm Name",
  farmAddressFull: "123 Farm Lane",
  gpsCoordinates: "40.7128,-74.0060",
  farmAreaInAcres: 50,
  cropName: "Tomatoes",
  cropVariety: "Cherry",
  seedSource: "Certified Organic",
  sowingDate: timestamp,
  harvestDate: timestamp,
  organicCertificationAuthority: "USDA",
  certificationNumber: "ORG123456",
  certificationExpiryDate: timestamp
}
```

### 3. DistributorDashboard.jsx
**Role:** Purchase batches from farmers & add distribution details
- View all available batches
- Select a batch and purchase quantity
- Add distributor information (company, vehicle, storage conditions)
- Records quality check and temperature control

**Key Fields:**
```javascript
{
  companyName: "Green Logistics Inc.",
  companyAddressFull: "456 Distribution Ave",
  transportVehicleNumber: "VEHICLE-001",
  pickupDate: timestamp,
  deliveryDate: timestamp,
  storageTemperature: "-5°C",
  warehouseLocation: "Warehouse A",
  qualityCheckStatus: "Good"
}
```

### 4. RetailerDashboard.jsx
**Role:** Purchase batches from distributors & add retail details
- View all available batches
- Purchase specific quantities
- Add retail store information (shelf location, price, expiry details)
- Final preparation for consumer sale

**Key Fields:**
```javascript
{
  storeName: "Organic Market",
  storeAddressFull: "789 Market Street",
  productReceivedDate: timestamp,
  productExpiryDate: timestamp,
  shelfLifeInDays: 7,
  storageCondition: "Refrigerated",
  retailPricePerKg: 8.99,
  availabilityStatus: "In Stock"
}
```

### 5. ConsumerView.jsx
**Role:** Scan QR code to trace full supply chain
- Enter or scan batchId from QR code
- View complete batch journey
- See all parent/child batch relationships
- Verify organic certification and storage conditions

## Data Flow Example

```
1. FARMER creates batch B1
   - Farmer data stored on-chain
   - Returns batchId "B1"
   
2. DISTRIBUTOR purchases from B1
   - Purchases 500kg from B1 (1000kg available)
   - Creates child batch B1-1
   - Stores distributor transit data
   
3. RETAILER purchases from B1-1
   - Purchases 200kg from B1-1
   - Creates child batch B1-1-1
   - Stores retail shelf information
   
4. CONSUMER scans QR (batch B1-1-1)
   - Traces back: B1-1-1 → B1-1 → B1
   - Views all 3 parties' data
   - Verifies organic certification & handling
```

## Setup Instructions

### 1. Environment Setup
Create `.env.local` in frontend root:
```
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c93c7D8d02A59136
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Ensure Services Running
- **Backend:** `npm run dev` (from /backend)
- **Ganache:** Local blockchain on http://127.0.0.1:7545
- **MetaMask:** Connected to Ganache and logged in

## Common Workflow

### As a Farmer:
1. Login with farmer email/password
2. Connect MetaMask wallet
3. Fill in farm details and crop information
4. Create batch with quantity (e.g., 1000kg tomatoes)
5. Share batchId with distributor

### As a Distributor:
1. Login with distributor email/password
2. Connect MetaMask wallet
3. Select farmer's batch from dropdown
4. Purchase desired quantity (e.g., 500kg)
5. Fill in transportation & storage details
6. Share new batchId with retailer

### As a Retailer:
1. Login with retailer email/password
2. Connect MetaMask wallet
3. Select distributor's batch
4. Purchase shelf quantity (e.g., 200kg)
5. Fill in store & expiry details
6. Generate QR code with final batchId

### As a Consumer:
1. Scan QR code from product
2. Enter batchId in ConsumerView
3. View entire supply chain history
4. Verify authenticity and certifications

## Error Handling

All pages include try-catch blocks for:
- MetaMask connection failures
- Contract interaction errors
- Network timeouts
- Invalid batch IDs

Errors are displayed to user with descriptive messages.

## Security Notes

- JWT tokens stored in localStorage (production should use httpOnly cookies)
- Only wallet owner can add details to their batches
- All blockchain transactions require MetaMask confirmation
- Email/password authentication prevents unauthorized access
- Off-chain JWT prevents anonymous blockchain interaction

## Future Enhancements

- QR code generation library integration
- PDF report generation for traceability
- GraphQL for complex queries
- Real-time event subscriptions
- Mobile app integration
- SMS/Email notifications for batch transfers
- Price analytics and market trends
- Regulatory compliance dashboard
