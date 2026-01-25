import React from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';
import { useUIStore } from './store/uiStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Oposiciones } from './pages/Oposiciones';
import { TestSelect } from './pages/TestSelect';
import { TestCreate } from './pages/TestCreate';
import { TestTake } from './pages/TestTake';
import { TestResults } from './pages/TestResults';
import { Estadisticas } from './pages/Estadisticas';
import { DashboardAnki } from './pages/DashboardAnki';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPreguntas } from './pages/AdminPreguntas';
import { AdminTemas } from './pages/AdminTemas';
import { AdminOposiciones } from './pages/AdminOposiciones';
import { NotFound } from './pages/NotFound';

const getTheme = (darkMode) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#667eea',
      },
      secondary: {
        main: '#764ba2',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route
        path="login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="oposiciones"
        element={
          <ProtectedRoute>
            <Oposiciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="test"
        element={
          <ProtectedRoute>
            <TestSelect />
          </ProtectedRoute>
        }
      />
      <Route
        path="test/create"
        element={
          <ProtectedRoute>
            <TestCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="test/:attemptId"
        element={
          <ProtectedRoute>
            <TestTake />
          </ProtectedRoute>
        }
      />
      <Route
        path="test/results/:attemptId"
        element={
          <ProtectedRoute>
            <TestResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="estadisticas"
        element={
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        }
      />
      <Route
        path="anki"
        element={
          <ProtectedRoute>
            <DashboardAnki />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="admin/preguntas"
        element={
          <AdminRoute>
            <AdminPreguntas />
          </AdminRoute>
        }
      />
      <Route
        path="admin/temas"
        element={
          <AdminRoute>
            <AdminTemas />
          </AdminRoute>
        }
      />
      <Route
        path="admin/oposiciones"
        element={
          <AdminRoute>
            <AdminOposiciones />
          </AdminRoute>
        }
      />
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  const darkMode = useUIStore((state) => state.darkMode);
  const theme = React.useMemo(() => getTheme(darkMode), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
