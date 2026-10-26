import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import transactionReducer from './slices/transactionSlice';
import reportReducer from './slices/reportSlice';
import web3Reducer from './slices/web3Slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    reports: reportReducer,
    web3: web3Reducer,
  },
  // SECURITY/CORRECTNESS: the serializability check is intentionally left
  // ENABLED. Web3 provider/signer/contract instances are non-serializable
  // objects and must NOT be stored in Redux state (they caused stale
  // signers, broke time-travel debugging, and previously required disabling
  // this guard). Keep them in module-scoped refs or React context; only
  // plain-data snapshots (addresses, chainId, block numbers) belong here.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;