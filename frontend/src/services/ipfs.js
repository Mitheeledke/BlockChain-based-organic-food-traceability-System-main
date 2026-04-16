import { create } from "ipfs-http-client";

const IPFS_API_URL = import.meta.env.VITE_IPFS_API_URL || "http://127.0.0.1:5001/api/v0";
const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL || "http://127.0.0.1:8080/ipfs";

function getClient() {
  try {
    return create({ url: IPFS_API_URL });
  } catch (err) {
    console.warn("IPFS client could not be created:", err);
    return null;
  }
}

export async function uploadFileToIpfs(file) {
  if (!file) {
    throw new Error("No file provided for IPFS upload");
  }

  const client = getClient();
  if (!client) {
    throw new Error("IPFS client unavailable. Ensure a local IPFS node is running at http://127.0.0.1:5001");
  }

  const added = await client.add(file);
  return added.path || added.cid?.toString();
}

export function makeIpfsUrl(hash) {
  if (!hash) return "";
  return `${IPFS_GATEWAY_URL}/${hash}`;
}
