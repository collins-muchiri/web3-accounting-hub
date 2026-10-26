import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Plain-data transaction record — serializable by design. */
export interface TransactionRecord {
  id: string;
  amountCents: number; // integers only: never floats for money
  currency: string;
  description: string;
  category: string;
  date: string; // ISO-8601
  accountId: string;
}

export interface TransactionsState {
  items: TransactionRecord[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  status: 'idle',
  error: null,
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    fetchStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    fetchSuccess(state, action: PayloadAction<TransactionRecord[]>) {
      state.items = action.payload;
      state.status = 'ready';
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },
    upsertTransaction(state, action: PayloadAction<TransactionRecord>) {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure, upsertTransaction } =
  transactionSlice.actions;
export default transactionSlice.reducer;
