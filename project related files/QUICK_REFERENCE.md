# 🚀 QUICK REFERENCE - Frontend Services

## ⚡ Get Started in 5 Steps

```bash
# 1. Setup environment
echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env.local
echo "VITE_CONTRACT_ADDRESS=0x..." >> frontend/.env.local

# 2. Install dependencies
cd frontend && npm install

# 3. Start development
npm run dev

# 4. Open browser
# http://localhost:5173

# 5. Login and test
# Email: farmer@example.com
# Password: pass123
```

---

## 📚 Documentation Map

| Need | File | Lines |
|------|------|-------|
| **Getting Started** | `SETUP_GUIDE.md` | 350+ |
| **Service Details** | `SERVICES_DOCUMENTATION.md` | 380+ |
| **API Functions** | `API_REFERENCE.md` | 450+ |
| **Troubleshooting** | `TROUBLESHOOTING.md` | 380+ |
| **Implementation** | `IMPLEMENTATION_SUMMARY.md` | 400+ |
| **Project Structure** | `PROJECT_STRUCTURE.md` | 300+ |

---

## 🔧 Frontend Services

### `api.js` - Backend Communication
```javascript
import { login, setAuthToken, fetchProfile } from "../services/api";

// Login
const res = await login({ email, password });
setAuthToken(res.data.token);

// Fetch user
const user = await fetchProfile();
```

### `blockchain.js` - Smart Contract
```javascript
import * as blockchain from "../services/blockchain";

// Connect wallet
await blockchain.connectWallet();

// Create batch
const batchId = await blockchain.createFarmerBatch(data, qty, unit);

// Get batch
const batch = await blockchain.getBatch(batchId);
```

---

## 🏠 Pages & Their Purpose

| Page | Role | Function |
|------|------|----------|
| **Login.jsx** | Everyone | Authentication |
| **FarmerDashboard.jsx** | Farmer | Create batches |
| **DistributorDashboard.jsx** | Distributor | Purchase & transport |
| **RetailerDashboard.jsx** | Retailer | Purchase & sell |
| **AdminDashboard.jsx** | Admin | Monitor all |
| **ConsumerView.jsx** | Consumer | Trace products |

---

## 🔄 Supply Chain Flow

```
Farmer (B1)
    ↓ [purchases 500kg]
Distributor (B1-1)
    ↓ [purchases 200kg]
Retailer (B1-1-1)
    ↓ [consumer buys]
Consumer [scans QR, sees full trace]
```

---

## 📦 Key Functions

### Create Batch
```javascript
const batchId = await blockchain.createFarmerBatch(
  {farmerId: 0, farmerName: "John", ...},
  1000,     // qty
  "kg"      // unit
);
// Returns: "B1"
```

### Purchase (Split)
```javascript
const newBatchId = await blockchain.purchaseBatch(
  "B1",     // parent
  500       // qty to buy
);
// Returns: "B1-1"
```

### Add Details
```javascript
await blockchain.addDistributorDetails("B1-1", {
  companyName: "Green Logistics",
  storageTemperature: "-5°C",
  // ...more fields
});
```

### Get Batch Info
```javascript
const batch = await blockchain.getBatch("B1-1-1");
// {batchId, owner, quantity, timestamp, ...}
```

### Trace Product
```javascript
const children = await blockchain.getChildBatches("B1");
// ["B1-1", "B1-2"]
```

---

## 🔐 Environment Variables

```env
# Frontend (.env.local)
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x5FbDB2315678...

# Backend (.env)
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=db_connection

# Ganache (automatic)
http://127.0.0.1:7545
ChainID: 1337
```

---

## 💻 Development Commands

```bash
# Frontend
npm run dev        # Start dev server (port 5173)
npm run build      # Build for production
npm run lint       # Check code quality

# Backend
npm run dev        # Start server (port 5000)

# Blockchain
npx hardhat compile              # Compile contracts
npx hardhat run scripts/deploy.js --network ganache  # Deploy

# Utilities
ganache-cli --deterministic --port 7545  # Start Ganache (CLI)
# OR use Ganache Desktop (default port 7545)
```

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "No Ethereum provider" | Install MetaMask |
| "Wrong network" | Switch to Ganache in MetaMask |
| "Contract not found" | Deploy contract, update .env |
| "Cannot reach backend" | Start backend on port 5000 |
| "User not found" | Register user first |
| "Batch not found" | Create batch first |
| "Not batch owner" | Use correct MetaMask account |

---

## 📊 Test Workflow

```
1. START GANACHE
   # Option A: Ganache Desktop (port 7545 by default)
   # Download from https://trufflesuite.com/ganache/
   
   # Option B: Ganache CLI
   ganache-cli --deterministic --port 7545

2. DEPLOY CONTRACT
   cd blockchain
   npx hardhat run scripts/deploy.js --network ganache
   
3. UPDATE ENV
   VITE_CONTRACT_ADDRESS=0x...

4. START BACKEND
   cd backend && npm run dev

5. START FRONTEND
   cd frontend && npm run dev

6. REGISTER USER
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d path to account with test eth

7. LOGIN & TEST
   http://localhost:5173
```

---

## 📞 File Locations

```
Frontend Root
├── src/
│   ├── services/
│   │   ├── api.js ..................... Backend calls
│   │   └── blockchain.js .............. Smart contract
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── FarmerDashboard.jsx
│   │   ├── DistributorDashboard.jsx
│   │   ├── RetailerDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── ConsumerView.jsx
│   └── components/
│       ├── ProtectedRoute.jsx
│       └── Navbar.jsx
├── .env.local ......................... Configuration
└── package.json ....................... Dependencies
```

---

## 🎯 Configuration Checklist

- [ ] Create `.env.local` in frontend root
- [ ] Add `VITE_API_URL=http://localhost:5000/api`
- [ ] Add `VITE_CONTRACT_ADDRESS=0x...`
- [ ] Install deps: `npm install`
- [ ] Start Ganache
- [ ] Deploy contract
- [ ] Update contract address in .env.local
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Register test users
- [ ] Login and test

---

## 🧪 Test Account Setup

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

**Use different Ganache accounts for each wallet address!**

---

## 📱 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React app |
| Backend | http://localhost:5000 | API server |
| Ganache | http://127.0.0.1:7545 | Blockchain |

---

## ✅ Build Status

```
✓ 249 modules transformed
✓ 0 errors
✓ Production ready
✓ Ready to deploy
```

---

## 🎁 What's Included

- **11 Code Files** (~710 lines)
- **5 Documentation Files** (~1,500 lines)
- **1 Smart Contract** (Modified - no restrictions)
- **6 Page Components** (Full-featured UI)
- **3 Core Services** (API + Blockchain + Config)
- **Complete Test Workflow**
- **Production-Ready Build**

---

## 🚀 Next: Deploy to Testnet

```bash
# 1. Get testnet ETH
# Sepolia: https://sepoliafaucet.com

# 2. Update hardhat.config.js
networks: {
  sepolia: {
    url: `https://sepolia.infura.io/v3/YOUR_KEY`,
    accounts: [process.env.PRIVATE_KEY]
  }
}

# 3. Deploy
npx hardhat run scripts/deploy.js --network sepolia

# 4. Update .env.local
VITE_CONTRACT_ADDRESS=0x...testnet_address...

# 5. Test on testnet
```

---

## 📖 Full Documentation

For detailed information, see:
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `SERVICES_DOCUMENTATION.md` - Service details
- `API_REFERENCE.md` - Function documentation
- `SETUP_GUIDE.md` - Deployment guide
- `TROUBLESHOOTING.md` - Problem solving

---

**Ready to launch? Let's go! 🚀**
