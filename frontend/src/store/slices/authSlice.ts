import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  token: string | null;
  user: { id: string; email: string; role: 'admin' | 'accountant' | 'viewer' } | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'unauthenticated',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.status = 'loading';
    },
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; user: AuthState['user'] }>,
    ) {
      // NOTE: persisting JWTs in client-readable storage is an XSS risk;
      // prefer httpOnly cookies from the backend once auth is implemented.
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    loginFailure(state) {
      state.token = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;
