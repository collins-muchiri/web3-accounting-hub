import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * IMPORTANT DESIGN RULE (audit finding #7):
 * Never store ethers.js BrowserProvider / Signer / Contract instances here.
 * They are non-serializable and caused the previous code to disable Redux's
 * serializability guard. Keep live provider objects in web3/providerRef.ts
 * (module-scoped) and mirror only plain-data snapshots into this slice.
 */
export interface Web3State {
  /** Connected wallet address (checksummed EVM address), or null. */
  address: string | null;
  /** Chain ID reported by the wallet — verify against expected network. */
  chainId: number | null;
  /** Last known block number observed by the UI (informational). */
  blockNumber: number | null;
  connected: boolean;
}

const initialState: Web3State = {
  address: null,
  chainId: null,
  blockNumber: null,
  connected: false,
};

const web3Slice = createSlice({
  name: 'web3',
  initialState,
  reducers: {
    walletConnected(
      state,
      action: PayloadAction<{ address: string; chainId: number }>,
    ) {
      state.address = action.payload.address;
      state.chainId = action.payload.chainId;
      state.connected = true;
    },
    blockUpdated(state, action: PayloadAction<number>) {
      state.blockNumber = action.payload;
    },
    walletDisconnected(state) {
      state.address = null;
      state.chainId = null;
      state.blockNumber = null;
      state.connected = false;
    },
  },
});

export const { walletConnected, blockUpdated, walletDisconnected } =
  web3Slice.actions;
export default web3Slice.reducer;
