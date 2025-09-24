import { BigNumberish, shortString } from "starknet";
import * as starknet from "@scure/starknet";

export const stringToFelt = (v: string): BigNumberish =>
  v ? shortString.encodeShortString(v) : "0x0";

export const feltToString = (v: BigNumberish): string => {
  return BigInt(v) > 0n ? shortString.decodeShortString(bigintToHex(v)) : "";
};

export const bigintToHex = (v: BigNumberish): `0x${string}` =>
  !v ? "0x0" : `0x${BigInt(v).toString(16)}`;

export function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function ellipseAddress(address: string, start: number, end: number) {
  return `${address.slice(0, start)}...${address.slice(-end)}`.toUpperCase();
}

export const getShortNamespace = (namespace: string) => {
  let parts = namespace.split('_');
  let short = parts[0] + parts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return short;
}

export function getMenuLeftOffset() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const windowAspect = windowWidth / windowHeight;
  const imageAspect = 16 / 9;

  let imageWidth, imageHeight, leftOffset;
  if (windowAspect > imageAspect) {
    // Window is wider than 16:9
    imageHeight = windowHeight;
    imageWidth = imageHeight * imageAspect;
    leftOffset = (windowWidth - imageWidth) / 2;
  } else {
    // Window is taller than 16:9
    imageWidth = windowWidth;
    imageHeight = imageWidth / imageAspect;
    leftOffset = 0;
  }
  return leftOffset;
}

export function beastNameSize(name: string) {
  if (name.length > 30) {
    return '12px';
  } else if (name.length > 28) {
    return '13px';
  } else if (name.length > 26) {
    return '14px';
  } else if (name.length > 24) {
    return '15px';
  } else {
    return '16px';
  }
}

export function decodeHexByteArray(byteArray: string[]): string {
  // Skip the first byte if it's a length prefix (like 0x1a6)
  // Start from index 1 to get the actual data
  const dataBytes = byteArray.slice(1);

  // Convert hex byte array to string
  const hexString = dataBytes.map((byte: string) => {
    // Remove '0x' prefix and ensure 2 characters
    const cleanByte = byte.replace('0x', '').padStart(2, '0');
    return cleanByte;
  }).join('');

  // Convert hex to string using browser-compatible method
  const decodedString = hexString.match(/.{1,2}/g)?.map((byte: string) =>
    String.fromCharCode(parseInt(byte, 16))
  ).join('') || '';

  return decodedString;
}

export function extractImageFromTokenURI(tokenURI: string): string | null {
  try {
    // Check if it's a data URI
    if (tokenURI.startsWith('data:application/json;base64,')) {
      // Extract the base64 part
      const base64Data = tokenURI.replace('data:application/json;base64,', '');

      // Clean the base64 string - remove any invalid characters
      const cleanBase64 = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');

      // Add padding if needed
      const paddedBase64 = cleanBase64 + '='.repeat((4 - cleanBase64.length % 4) % 4);

      // Decode base64 to string
      const jsonString = atob(paddedBase64);
      // Clean the JSON string to remove control characters
      const cleanJsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      // Parse the JSON
      const metadata = JSON.parse(cleanJsonString);
      // Return the image field
      return metadata.image || null;
    }
    return tokenURI; // Return as-is if not a data URI
  } catch (error) {
    console.error('Error extracting image from token URI:', error);
    return null;
  }
}

export function parseBalances(
  results: { id: number; jsonrpc: string; result: [string, string] }[],
  tokens: { name: string; address: string; displayDecimals: number; decimals?: number; }[],
): Record<string, string> {
  function toBigIntSmart(v: string | number | bigint): bigint {
    const s = String(v);
    return s.startsWith("0x") ? BigInt(s) : BigInt(s);
  }

  function uint256ToBigInt([low, high]: [string, string]): bigint {
    return (toBigIntSmart(high) << 128n) + toBigIntSmart(low);
  }

  function formatBalance(raw: bigint, tokenDecimals = 18, showDecimals = 4): string {
    const base = 10n ** BigInt(tokenDecimals);
    const intPart = raw / base;
    const fracPart = raw % base;
    const frac = fracPart.toString().padStart(tokenDecimals, "0").slice(0, showDecimals);
    return `${intPart}${showDecimals > 0 ? "." + frac : ""}`;
  }

  const out: Record<string, string> = {};
  for (let i = 0; i < results.length; i++) {
    const token = tokens[i];
    const raw = uint256ToBigInt(results[i].result);
    const tokenDecimals = token.decimals ?? 18;
    const shownDecimals = token.displayDecimals;
    out[token.name] = formatBalance(raw, tokenDecimals, shownDecimals);
  }
  return out;
}

// Utility function to format numbers with appropriate decimal places
export const formatAmount = (value: number): string => {
  if (value === 0) return '0';

  const absValue = Math.abs(value);

  if (absValue < 0.000001) {
    // For very small numbers, show up to 8 decimal places
    return value.toFixed(10).replace(/\.?0+$/, '');
  } else if (absValue < 0.001) {
    // For small numbers, show up to 5 decimal places
    return value.toFixed(5).replace(/\.?0+$/, '');
  } else if (absValue < 1) {
    // For numbers less than 1, show up to 4 decimal places
    return value.toFixed(4).replace(/\.?0+$/, '');
  } else if (absValue < 10) {
    // For single digit numbers, show 2 decimal places
    return value.toFixed(2).replace(/\.?0+$/, '');
  } else if (absValue < 100) {
    // For double digit numbers, show 1 decimal place
    return value.toFixed(1).replace(/\.?0+$/, '');
  } else {
    // For larger numbers, show no decimal places
    return Math.round(value).toString();
  }
};

export function formatRewardNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function generateSalt(gameId: number, xp: number) {
  let params = [BigInt(xp), BigInt(gameId)];
  let poseidon = starknet.poseidonHashMany(params);
  return poseidon;
}

export function generateBattleSalt(gameId: number, xp: number, actionCount: number) {
  let params = [BigInt(xp), BigInt(gameId), BigInt(actionCount)];
  let poseidon = starknet.poseidonHashMany(params);
  return poseidon;
}