// address and ABI helper for the deployed smart contract
// set VITE_CONTRACT_ADDRESS in a .env file (e.g. VITE_CONTRACT_ADDRESS=0x123...)
// you can also hard‑code the address for local Ganache/hardhat deployment.

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ABI is imported dynamically in blockchain service; this file just holds the address.
