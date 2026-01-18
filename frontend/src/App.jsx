import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Oposiciones } from './pages/Oposiciones';
import { TestCreate } from './pages/TestCreate';
import { TestTake } from './pages/TestTake';
import { TestResults } from './pages/TestResults';
import { Estadisticas } from './pages/Estadisticas';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPreguntas } from './pages/AdminPreguntas';
import { AdminTemas } from './pages/AdminTemas';
import { AdminOposiciones } from './pages/AdminOposiciones';
import { NotFound } from './pages/NotFound';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/oposiciones"
            element={
              <ProtectedRoute>
                <Oposiciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/create"
            element={
              <ProtectedRoute>
                <TestCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/:attemptId"
            element={
              <ProtectedRoute>
                <TestTake />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/results/:attemptId"
            element={
              <ProtectedRoute>
                <TestResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute>
                <Estadisticas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/preguntas"
            element={
              <AdminRoute>
                <AdminPreguntas />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/temas"
            element={
              <AdminRoute>
                <AdminTemas />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/oposiciones"
            element={
              <AdminRoute>
                <AdminOposiciones />
              </AdminRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
