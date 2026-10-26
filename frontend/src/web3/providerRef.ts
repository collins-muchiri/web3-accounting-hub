import { BrowserProvider } from 'ethers';

/**
 * Module-scoped holder for the live ethers BrowserProvider.
 *
 * Rationale (audit finding #7): provider/signer objects are NOT
 * serializable and must never be dispatched into Redux state. They live
 * here instead; only plain-data snapshots (address, chainId, block) go
 * into the web3 slice. This keeps the Redux serializability check enabled.
 */
let providerRef: BrowserProvider | null = null;

export function setProvider(provider: BrowserProvider | null): void {
  providerRef = provider;
}

export function getProvider(): BrowserProvider | null {
  return providerRef;
}
