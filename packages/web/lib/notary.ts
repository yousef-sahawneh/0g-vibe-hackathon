import type { Address } from "viem";

export const NOTARY_ABI = [
  {
    type: "function",
    name: "notarize",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rootHash", type: "string" },
      { name: "filename", type: "string" },
      { name: "label",    type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getRecord",
    stateMutability: "view",
    inputs: [{ name: "rootHash", type: "string" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "notarizer", type: "address" },
          { name: "timestamp", type: "uint256" },
          { name: "filename",  type: "string"  },
          { name: "label",     type: "string"  },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getByOwner",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "string[]" }],
  },
  {
    type: "function",
    name: "totalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Notarized",
    inputs: [
      { name: "notarizer", type: "address", indexed: true  },
      { name: "rootHash",  type: "string",  indexed: false },
      { name: "filename",  type: "string",  indexed: false },
      { name: "label",     type: "string",  indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export type NotaryRecord = {
  notarizer: Address;
  timestamp: bigint;
  filename:  string;
  label:     string;
};

export function getContractAddress(): Address | null {
  const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!addr || addr === "") return null;
  return addr as Address;
}

export function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function shortHash(hash: string, chars = 10): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}…${hash.slice(-6)}`;
}
