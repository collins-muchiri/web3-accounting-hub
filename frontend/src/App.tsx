import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { theme } from './theme';
import { store } from './store';

// Placeholder pages until real components exist. Each is intentionally a
// stub: the previous App.tsx imported Layout/ProtectedRoute/Dashboard/etc.
// that were never committed to this repository, which broke the build.
const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 24 }}>
    <h1>{name}</h1>
    <p>This page is not implemented yet.</p>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Placeholder name="Login" />} />
            {/* NOTE: ProtectedRoute (auth guard) does not exist yet; every
                route below is currently unauthenticated scaffolding. Do not
                expose real financial data until auth + guards ship with
                tests. */}
            <Route path="/" element={<Placeholder name="Dashboard" />} />
            <Route
              path="/transactions"
              element={<Placeholder name="Transactions" />}
            />
            <Route path="/reports" element={<Placeholder name="Reports" />} />
            <Route path="/settings" element={<Placeholder name="Settings" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;