# Frontend Services - Common Issues & Troubleshooting

## 🔧 Issue Diagnosis & Solutions

### Category 1: MetaMask & Wallet Connection

#### Issue: "No Ethereum provider found. Install MetaMask."
**Symptoms:**
- App crashes on wallet connection attempt
- Error appears in browser console

**Solutions:**
```javascript
// Verify MetaMask is installed
if (!window.ethereum) {
  console.error("MetaMask not found");
  // User needs to install MetaMask
}

// Try manual connection
try {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
} catch (error) {
  console.error("User rejected connection");
}
```

**Fix:**
1. Install MetaMask extension from chrome.google.com/webstore
2. Create/import wallet
3. Reload page
4. Try connecting again

---

#### Issue: "Wrong Network - Please connect to Ganache"
**Symptoms:**
- MetaMask shows red alert
- Can't create batches
- Transaction fails

**Solution:**
1. Open MetaMask
2. Click Network dropdown (top)
3. Select or add Ganache:
   - **Network Name:** Ganache
   - **RPC URL:** http://127.0.0.1:7545
   - **Chain ID:** 1337
   - **Currency:** ETH
4. Reload page
5. Try again

---

#### Issue: "Insufficient Balance" or "Out of Gas"
**Symptoms:**
- Transaction fails immediately
- MetaMask shows error

**In Ganache Environment (not real):**
```bash
# This shouldn't happen - you have 100 ETH
# If it does, check:

1. Verify correct account imported
2. Ganache running? Check port 7545
3. Try importing fresh account from Ganache output
```

**In Testnet:**
```bash
# Need actual testnet ETH
# Get from faucet:
# Sepolia: https://sepoliafaucet.com
# Mumbai: https://faucet.polygon.technology
```

---

### Category 2: Blockchain Service Connection

#### Issue: "Contract address not configured"
**Symptoms:**
- "VITE_CONTRACT_ADDRESS is not configured"
- Can't interact with blockchain

**Solution:**
```javascript
// File: src/config/contract.js
// Check 1: Contract address exists
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
// ↑ Should not be empty

// Check 2: Environment file exists
// frontend/.env.local should contain:
// VITE_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c93c7D8d02A59136
```

**Steps:**
1. Create `frontend/.env.local` (note: LOCAL not PROD)
2. Add: `VITE_CONTRACT_ADDRESS=0x...deployed_address...`
3. Restart dev server: `npm run dev`
4. Clear browser cache: Ctrl+Shift+Delete

---

#### Issue: "Contract not found at address"
**Symptoms:**
- "revert" error
- "no code at that address"

**Causes:**
1. Wrong address copied
2. Contract not deployed to that network
3. Contract address is for different chain

**Solution:**
```bash
# Step 1: Deploy contract to Ganache
cd blockchain
npx hardhat run scripts/deploy.js --network ganache

# Step 2: Copy output address
# Example: "FoodTraceability deployed to: 0x5FbDB2315678afccb333f8a9c93c7D8d02A59136"

# Step 3: Update frontend .env.local
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c93c7D8d02A59136

# Step 4: Restart dev server
npm run dev

# Step 5: Clear cache and reload browser
```

---

#### Issue: "ABI mismatch" or "Unknown function"
**Symptoms:**
- Function doesn't exist error
- ABI encoding error
- "Unknown method"

**Solution:**
```bash
# ABI must match deployed contract

# Option 1: Copy fresh ABI
cd blockchain
# After compile and deploy, copy from:
artifacts/contracts/FoodTraceability.sol/FoodTraceability.json

# Option 2: Regenerate
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache

# Option 3: Verify contractABI.json in frontend
# Check it has these methods:
# - createFarmerBatch
# - purchaseBatch
# - addDistributorDetails
# - addRetailerDetails
# - getBatch
# - getChildBatches
# - getAllBatchIds
```

---

### Category 3: API & Backend Connection

#### Issue: "Cannot reach backend - connect to http://localhost:5000"
**Symptoms:**
- Login form won't submit
- Registration fails
- Network error in console

**Solution:**
```bash
# Check 1: Backend running?
# Terminal should show:
# "Server running on port 5000"
# "Database Connected"

# Check 2: Correct .env.local?
# frontend/.env.local should have:
VITE_API_URL=http://localhost:5000/api

# Check 3: Start backend
cd backend
npm run dev

# Check 4: Test directly
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'
```

---

#### Issue: "Invalid token" or "401 Unauthorized"
**Symptoms:**
- Login succeeds but fetching profile fails
- Can't access protected routes

**Solution:**
```javascript
// Check token storage
const token = localStorage.getItem("token");
console.log("Stored token:", token); // Should exist

// Check API header
import API from "../services/api";
console.log(API.defaults.headers); // Should have Authorization

// Reset if broken:
localStorage.removeItem("token");
// Re-login to get fresh token
```

---

#### Issue: "User not found" on login
**Symptoms:**
- Correct password but error: "User not found"
- Can't login with any account

**Solution:**
```bash
# Check 1: User registered?
# Register new user first:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "test@example.com",
    "password": "testpass123",
    "role": "Farmer",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e1"
  }'

# Check 2: Database running?
# Backend logs should show:
# "Database Connected"

# Check 3: Email format
# Must be valid email: user@domain.com
```

---

#### Issue: "Email already registered"
**Symptoms:**
- Registration fails for existing email
- User can't update password

**Solution:**
```bash
# Use different email
# Or use existing credentials to login

# To clear database (development only):
# Delete database file, backend will recreate on startup
```

---

### Category 4: Frontend Rendering Issues

#### Issue: "Routes not working" - pages don't load
**Symptoms:**
- Clicking links does nothing
- URL changes but page doesn't render

**Solution:**
```javascript
// Check App.jsx - verify all routes
import { BrowserRouter, Routes, Route } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
    <Route path="/farmer" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
    // ... other routes
  </Routes>
</BrowserRouter>

// Clear cache if components not updating
// Ctrl+Shift+Delete or dev tools cache
```

---

#### Issue: "Component not rendering" - blank page
**Symptoms:**
- Page shows but nothing appears
- Console shows no errors

**Causes:**
1. Component not imported
2. Missing dependencies
3. useState/useEffect issues

**Solution:**
```javascript
// Check 1: Component imported in App.jsx?
import FarmerDashboard from "./pages/FarmerDashboard";

// Check 2: All imports in component?
import { useState, useEffect } from "react";
import * as blockchain from "../services/blockchain";

// Check 3: useEffect has dependency array
useEffect(() => {
  // code
}, []); // ← Don't forget array

// Check 4: Return JSX
export default function FarmerDashboard() {
  // ... code
  return (
    <div>Component content</div>  // ← Must return something
  );
}
```

---

#### Issue: "Service not loading" - "Cannot find module"
**Symptoms:**
- Import error in console
- "Cannot find module ../services/api"

**Solution:**
```javascript
// Check file path (case-sensitive on Linux/Mac)
// ✓ Correct:
import { login } from "../services/api";

// ✗ Wrong:
import { login } from "../Services/api";    // Capital S
import { login } from "../services/Api.js"; // Capital A + .js

// File names are case-sensitive!
```

---

### Category 5: Transaction & Smart Contract Errors

#### Issue: "Batch not found"
**Symptoms:**
- Error when trying to purchase or view batch
- "Batch not found" message

**Solution:**
```javascript
// Check batch actually exists
const allBatches = await blockchain.getAllBatchIds();
console.log("Available batches:", allBatches);

// Verify typed correctly
// Batch IDs: "B1", "B1-1", "B1-1-1" (no spaces)
// Not: "b1" (lowercase), "B 1" (spaces), "B1.1" (dots)

// Create new batch if needed
// Must be Farmer role to create initial batches
```

---

#### Issue: "Not batch owner"
**Symptoms:**
- Can't add distributor/retailer details
- "Not batch owner" error

**Solution:**
```javascript
// Only batch owner (the one who created/purchased it) can add details

// Correct flow:
// 1. Farmer creates batch B1 (farmer is owner)
// 2. Distributor purchases → creates B1-1 (distributor is owner)
// 3. Distributor can add details to B1-1 (they own it)
// 4. Distributor can't modify B1 (farmer owns it)

// Check: Are you logged in as the right role?
// Use different MetaMask account for each role
```

---

#### Issue: "Revert" - transaction failed
**Symptoms:**
- MetaMask shows "Transaction failed"
- "Exception in contract"

**Common causes:**
```javascript
// 1. Insufficient quantity available
try {
  await blockchain.purchaseBatch("B1", 5000);
  // If B1 only has 1000, this fails
} catch (e) {
  console.error("Purchase failed - not enough quantity");
}

// 2. Invalid quantity (0 or negative)
await blockchain.purchaseBatch("B1", 0); // ✗ Fails
await blockchain.purchaseBatch("B1", 100); // ✓ OK

// 3. Already added details
await blockchain.addDistributorDetails("B1-1", data);
await blockchain.addDistributorDetails("B1-1", data); // ✗ Fails second time
```

---

### Category 6: Development Issues

#### Issue: "Port already in use"
**Symptoms:**
- `npm run dev` fails
- "Port 5173 is already in use"

**Solution:**
```bash
# Option 1: Kill existing process
# Find what's using port 5173
netstat -ano | find "5173"
# Kill process (Windows):
taskkill /PID <process_id> /F

# Option 2: Use different port
npm run dev -- --port 5174

# Option 3: Restart computer
```

---

#### Issue: "npm not found"
**Symptoms:**
- "npm: command not found"
- Node.js errors

**Solution:**
```bash
# Check Node.js installed
node --version

# Install Node.js if needed
# Download from nodejs.org (LTS version)

# Check npm
npm --version

# If still not found, add to PATH or reinstall Node.js
```

---

#### Issue: Module dependency missing
**Symptoms:**
- "Cannot find module 'ethers'"
- Module not found errors

**Solution:**
```bash
# Install dependencies
npm install

# Verify ethers.js installed
npm list ethers

# If still failing:
rm -rf node_modules package-lock.json
npm install

# Specific install:
npm install ethers@6.16.0 react-router-dom axios
```

---

### Category 7: Performance Issues

#### Issue: App is slow / unresponsive
**Symptoms:**
- Clicking takes time to respond
- Network requests slow

**Optimization:**
```javascript
// 1. Optimize re-renders
const MyComponent = () => {
  const [value, setValue] = useState("");
  
  // ✗ Bad - updates on every keystroke
  const callServiceOnChange = async (v) => {
    setValue(v);
    await someService.call(v);
  };
  
  // ✓ Good - debounce or batch updates
  const handleChange = (v) => {
    setValue(v); // Instant UI feedback
    // Batch API calls
  };
};

// 2. Cache blockchain data
// Only call getAllBatchIds() once, cache result
const [batches, setBatches] = useState([]);
useEffect(() => {
  blockchain.getAllBatchIds().then(setBatches);
}, []);

// 3. Use pagination
// Don't load 10,000 batches at once
```

---

#### Issue: "Memory leak" warning
**Symptoms:**
- Console warning about memory leaks
- Component state not clearing

**Solution:**
```javascript
useEffect(() => {
  const fetchData = async () => {
    const data = await blockchain.getAllBatchIds();
    setBatches(data);
  };
  
  fetchData();
  
  // ✓ Cleanup on unmount
  return () => {
    // Cancel pending requests if needed
  };
}, []); // Empty dependency = only on mount
```

---

## 🆘 Emergency Recovery Checklist

If everything breaks, try this:

```bash
# 1. Stop all services
# Kill: Ganache, Backend, Frontend

# 2. Clear frontend cache
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Rebuild contract
cd blockchain
npm install
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
# COPY NEW ADDRESS

# 4. Update frontend
# Edit frontend/.env.local
# VITE_CONTRACT_ADDRESS=<new_address>

# 5. Start fresh
ganache-cli --deterministic --port 7545
# In new terminal:
cd backend
npm run dev
# In new terminal:
cd frontend
npm run dev

# 6. Register new test users
# Use curl commands from SETUP_GUIDE.md

# 7. Test basic flow
# Farmer login → Create batch
# Success!
```

---

## 📞 Get Help

**If you still need help:**

1. **Check logs:**
   - Browser console (F12)
   - Backend terminal output
   - Ganache output

2. **Common patterns:**
   - Check addresses (case-sensitive, 0x prefix)
   - Check timestamps (should be seconds, not ms)
   - Check network (Ganache vs Testnet)
   - Check account (different wallet for each role)

3. **Verify setup:**
   - Ganache running on 7545
   - Backend running on 5000
   - Frontend running on 5173
   - MetaMask connected to Ganache

4. **Reset if needed:**
   - Stop Ganache
   - Clear browser localStorage
   - Restart Ganache with fresh state
   - Re-deploy contract
   - Re-register users

---

**Good luck! 🚀**
