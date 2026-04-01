# Complete Setup & Deployment Guide

## Prerequisites

Before you start, ensure you have:
- Node.js 16+ installed
- MetaMask browser extension installed
- Ganache CLI (for local blockchain testing)
- Git (optional, for version control)

## Step 1: Blockchain Setup (Ganache)

### Install Ganache Desktop
Download from: https://trufflesuite.com/ganache/

Or use Ganache CLI:
```bash
npm install -g ganache-cli
ganache-cli --deterministic --port 7545
```

Keep this terminal open. Ganache will display 10 test accounts with 100 ETH each.

**Note:** Save one of the private keys for MetaMask setup.

## Step 2: Backend Setup

### Navigate to Backend
```bash
cd backend
npm install
```

### Create .env file
```
DATABASE_URL=your_database_url (if using PostgreSQL/MySQL)
JWT_SECRET=your_secret_key_12345
NODE_ENV=development
PORT=5000
```

### Start Backend Server
```bash
npx nodemon server.js
```

Backend runs on http://localhost:5000

## Step 3: Smart Contract Deployment

### Navigate to Blockchain Directory
```bash
cd blockchain
npm install
```

### Update hardhat.config.js
Ensure Ganache network is configured:
```javascript
networks: {
  ganache: {
    url: "http://127.0.0.1:7545",
    chainId: 1337,
    accounts: ["0x...your_private_key..."]
  }
}
```

### Compile Contract
```bash
npx hardhat compile
```

### Deploy to Ganache
```bash
npx hardhat run scripts/deploy.js --network ganache
```

**Save the deployed contract address!**

Example output:
```
FoodTraceability deployed to: 0x5FbDB2315678afccb333f8a9c93c7D8d02A59136
```

## Step 4: MetaMask Setup

### Connect to Ganache
1. Open MetaMask
2. Click Network → Add Network
3. **Network Name:** Ganache
4. **RPC URL:** http://127.0.0.1:7545
5. **Chain ID:** 1337
6. **Currency Symbol:** ETH
7. Click Save

### Import Test Account
1. In MetaMask, click on your profile → Import Account
2. Paste a private key from Ganache output
3. You now have 100 ETH in your wallet

## Step 5: Frontend Setup

### Navigate to Frontend
```bash
cd frontend
npm install
```

### Create .env.local
```
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c93c7D8d02A59136
```

Replace the contract address with your deployed address.

### Start Frontend Dev Server
```bash
npm run dev
```

Frontend runs on http://localhost:5173

## Step 6: Backend User Setup

### Register Users via API or UI

#### Using REST API (curl)
```bash
# Register Farmer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Farmer",
    "email": "farmer@example.com",
    "password": "pass123",
    "role": "Farmer",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e1"
  }'

# Register Distributor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Distributor",
    "email": "distributor@example.com",
    "password": "pass123",
    "role": "Distributor",
    "wallet_address": "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
  }'

# Register Retailer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Retailer",
    "email": "retailer@example.com",
    "password": "pass123",
    "role": "Retailer",
    "wallet_address": "0x1234567890123456789012345678901234567890"
  }'
```

Use different private key accounts from Ganache for each wallet address!

## Step 7: Testing the Application

### Test Farmer Flow
1. Go to http://localhost:5173
2. **Click "Login"**
3. Enter farmer email & password
4. **Click "Log in"**
5. You're redirected to FarmerDashboard
6. **Click "Connect Wallet"** (MetaMask pops up)
7. **Approve connection**
8. Fill in form (all fields can be test values):
   - Crop Name: "Tomatoes"
   - Total Quantity: 1000
   - Unit: "kg"
9. Click "Create Batch"
10. MetaMask prompts to sign transaction
11. **Approve transaction** with wallet
12. Wait for confirmation
13. **Save the Batch ID** (appears as "New batch id: B1")

### Test Distributor Flow
1. Logout (top navigation)
2. Login with distributor credentials
3. You're redirected to DistributorDashboard
4. Wallet should auto-connect
5. **Select the farmer's batch** from dropdown (e.g., "B1")
6. Enter purchase quantity: "500"
7. Click "Purchase"
8. Fill distributor details (all test values):
   - Company Name: "Green Logistics"
   - Company Address: "123 Distribution St"
   - Vehicle Number: "VEH-001"
   - Pickup/Delivery dates: any date
   - Storage Temp: "-5°C"
   - Warehouse: "Warehouse A"
9. Click "Add Details"
10. **Approve both transactions** in MetaMask
11. **Save new Batch ID** (should be "B1-1")

### Test Retailer Flow
1. Logout
2. Login with retailer credentials
3. Select batch "B1-1" from dropdown
4. Purchase quantity: "200"
5. Click "Purchase"
6. Fill retailer details:
   - Store Name: "Organic Market"
   - Store Address: "456 Market Lane"
   - Dates: any valid date
   - Shelf Life: "7" days
   - Price per Kg: "8.99"
7. Click "Add Details"
8. Approve transactions
9. **Final Batch ID** becomes "B1-1-1"

### Test Consumer Flow
1. **Don't logout** (consumer view is public)
2. In new tab, go to http://localhost:5173/consumer
3. Enter batch ID: "B1-1-1"
4. Click "Trace Product"
5. MetaMask prompts wallet connection (for read-only access)
6. **Approve connection**
7. View complete trace:
   - Current batch details (B1-1-1)
   - Owner address
   - Quantities
   - Timestamp
   - Child batches (empty for final batch)

### Trace the Chain
1. Click on parent batch from trace (if available)
2. This shows the previous owner's data
3. Continue clicking parents until you reach the farmer (Batch B1)
4. **Full traceability visible**

## Step 8: Admin Dashboard

1. Login with admin account
2. Go to /admin
3. View all batches created on blockchain
4. Click "View Details" on any batch
5. See full batch information and child batches
6. Click on children to explore tree

## Production Deployment

### Deploy to Testnet (Sepolia)

#### 1. Update hardhat.config.js
```javascript
networks: {
  sepolia: {
    url: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

#### 2. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### 3. Update Frontend .env.local
```
VITE_CONTRACT_ADDRESS=0x...deployed_address_on_sepolia...
```

### Deploy Backend
- Use cloud provider (Heroku, Railway, Render)
- Set environment variables
- Deploy database

### Deploy Frontend
- Build: `npm run build`
- Deploy to Vercel, Netlify, or Docker

## Troubleshooting

### MetaMask not connecting
- Ensure Ganache is running on http://127.0.0.1:7545
- Add Ganache network to MetaMask
- Try importing account again with correct private key

### Contract deployment fails
- Check hardhat.config.js network settings
- Ensure Ganache is running
- Verify private key is valid

### Backend won't start
- Check if port 5000 is already in use
- Verify .env file exists with JWT_SECRET
- Check database connection string

### Frontend localhost not found
- Ensure dev server running: `npm run dev`
- Check if port 5173 is free
- Clear browser cache

### Transaction fails
- Insufficient gas (shouldn't happen in Ganache)
- Account not in Ganache (re-import with correct private key)
- Contract state mismatch (redeploy contract)

## File Structure

```
project-root/
├── blockchain/
│   ├── contracts/FoodTraceability.sol
│   ├── scripts/deploy.js
│   └── hardhat.config.js
├── backend/
│   ├── controllers/authController.js
│   ├── routes/authRoutes.js
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/services/
│   │   ├── api.js (Backend integration)
│   │   └── blockchain.js (Web3 integration)
│   ├── src/pages/
│   │   ├── Login.jsx
│   │   ├── FarmerDashboard.jsx
│   │   ├── DistributorDashboard.jsx
│   │   ├── RetailerDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── ConsumerView.jsx
│   ├── .env.local (Local config)
│   └── package.json
```

## Key Points to Remember

1. **Each transaction requires MetaMask signature**
2. **Batch hierarchy is linear:** B1 → B1-1 → B1-1-1
3. **Only batch owner can add details**
4. **All data is immutable once recorded**
5. **Consumer view doesn't need login (public traceability)**
6. **Wallet address must match MetaMask connected account**

## Next Steps

- Add QR code generation library
- Implement SMS/Email notifications
- Add real-time event listeners
- Create PDF reports for batches
- Develop mobile app
- Add regulatory compliance checks
- Implement analytics dashboard
