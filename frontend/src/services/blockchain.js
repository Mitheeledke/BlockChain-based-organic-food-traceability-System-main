import { ethers } from "ethers";
import contractABI from "../config/contractABI.json";
import { CONTRACT_ADDRESS } from "../config/contract";

let provider;
let signer;
let contract;

function getProvider() {
  if (!provider) {
    if (typeof window !== "undefined" && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      throw new Error("No Ethereum provider found. Install MetaMask.");
    }
  }
  return provider;
}

async function getSigner() {
  if (!signer) {
    const prov = getProvider();
    signer = await prov.getSigner();
  }
  return signer;
}

function getContractInstance(signerOrProvider) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS is not configured. Set VITE_CONTRACT_ADDRESS in .env");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signerOrProvider);
}

export async function connectWallet() {
  const prov = getProvider();
  await prov.send("eth_requestAccounts", []);
  
  // Verify we're on the correct network (Ganache: 1337)
  const network = await prov.getNetwork();
  if (network.chainId !== 1337n) {
    throw new Error(
      `Wrong network! Current: ${network.chainId}, Expected: 1337 (Ganache). ` +
      `Switch MetaMask to the Ganache network (http://127.0.0.1:7545)`
    );
  }
  
  signer = await prov.getSigner();
  // refresh contract with signer
  contract = getContractInstance(signer);
  return signer;
}

export async function getCurrentAccount() {
  const prov = getProvider();
  const accounts = await prov.listAccounts();
  return accounts[0].address;
}

function getContractOrThrow() {
  if (!contract) {
    const s = signer || getProvider();
    contract = getContractInstance(s);
  }
  return contract;
}

// ======== helper wrappers for contract calls ========
export async function createFarmerBatch(farmerData, totalQuantity, unit, productPhotoHash = "") {
  const c = getContractOrThrow();
  const tx = await c.createFarmerBatch(farmerData, totalQuantity, unit, productPhotoHash);
  const receipt = await tx.wait();
  
  // Parse event from logs (ethers.js v6 uses logs, not events)
  if (receipt && receipt.logs && receipt.logs.length > 0) {
    try {
      const parsedLog = c.interface.parseLog(receipt.logs[0]);
      return {
        receipt,
        eventLog: parsedLog,
        batchId: parsedLog.args[0], // First argument is batchId
      };
    } catch (e) {
      console.warn("Could not parse event log", e);
      return { receipt };
    }
  }
  
  return { receipt };
}

export async function purchaseBatch(parentId, quantity) {
  const c = getContractOrThrow();
  const tx = await c.purchaseBatch(parentId, quantity);
  return tx.wait();
}

export async function addDistributorDetails(batchId, distributorData) {
  const c = getContractOrThrow();
  const tx = await c.addDistributorDetails(batchId, distributorData);
  return tx.wait();
}

export async function addRetailerDetails(batchId, retailerData) {
  const c = getContractOrThrow();
  const tx = await c.addRetailerDetails(batchId, retailerData);
  return tx.wait();
}

// fetch farmer, distributor, and retailer details by batch ID
export async function getFarmerDetails(batchId) {
  const c = getContractOrThrow();
  try {
    return await c.farmerDetails(batchId);
  } catch (err) {
    console.warn(`No farmer details for batch ${batchId}`);
    return null;
  }
}

export async function getDistributorDetails(batchId) {
  const c = getContractOrThrow();
  try {
    return await c.distributorDetails(batchId);
  } catch (err) {
    console.warn(`No distributor details for batch ${batchId}`);
    return null;
  }
}

export async function getRetailerDetails(batchId) {
  const c = getContractOrThrow();
  try {
    return await c.retailerDetails(batchId);
  } catch (err) {
    console.warn(`No retailer details for batch ${batchId}`);
    return null;
  }
}

// read-only calls
export async function getBatch(batchId) {
  const c = getContractOrThrow();
  return c.getBatch(batchId);
}

export async function getChildBatches(batchId) {
  const c = getContractOrThrow();
  return c.getChildBatches(batchId);
}

export async function getAllBatchIds() {
  const c = getContractOrThrow();
  return c.getAllBatchIds();
}

// utility to convert JS date -> unix timestamp (seconds)
export function toTimestamp(date) {
  if (date instanceof Date) return Math.floor(date.getTime() / 1000);
  const d = new Date(date);
  return Math.floor(d.getTime() / 1000);
}

// event listeners
export function subscribeToEvents(callback) {
  const c = getContractOrThrow();
  c.on("BatchCreated", (batchId, owner) => callback({ type: "BatchCreated", batchId, owner }));
  c.on("BatchPurchased", (parentId, newBatchId, buyer) => callback({ type: "BatchPurchased", parentId, newBatchId, buyer }));
  c.on("DistributorDetailsAdded", (batchId) => callback({ type: "DistributorDetailsAdded", batchId }));
  c.on("RetailerDetailsAdded", (batchId) => callback({ type: "RetailerDetailsAdded", batchId }));
}

export function unsubscribeFromEvents() {
  if (!contract) return;
  contract.removeAllListeners();
}

export default {
  connectWallet,
  getCurrentAccount,
  createFarmerBatch,
  purchaseBatch,
  addDistributorDetails,
  addRetailerDetails,
  getBatch,
  getFarmerDetails,
  getDistributorDetails,
  getRetailerDetails,
  getChildBatches,
  getAllBatchIds,
  toTimestamp,
  subscribeToEvents,
  unsubscribeFromEvents,
};
