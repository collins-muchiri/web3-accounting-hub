import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ReportSummary {
  id: string;
  name: string;
  generatedAt: string; // ISO-8601
  format: 'pdf' | 'csv' | 'xlsx';
}

export interface ReportsState {
  reports: ReportSummary[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  status: 'idle',
  error: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    fetchStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    fetchSuccess(state, action: PayloadAction<ReportSummary[]>) {
      state.reports = action.payload;
      state.status = 'ready';
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure } = reportSlice.actions;
export default reportSlice.reducer;
