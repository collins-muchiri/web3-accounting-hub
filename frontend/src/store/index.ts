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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['web3/setProvider', 'web3/setContract'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.provider', 'payload.contract'],
        // Ignore these paths in the state
        ignoredPaths: ['web3.provider', 'web3.contract'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;