import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Container,
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { clearAllTestData, getStorageInfo } from '../utils/localStorageManager';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'info' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearCache = () => {
    try {
      const info = getStorageInfo();
      const count = clearAllTestData();
      setSnackbar({
        open: true,
        message: `Limpiados ${count} tests (${info.estimatedSize})`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al limpiar caché',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleNavigate = (path) => {
    // Validar acceso a herramientas de admin
    if (path === '/preguntas') {
      if (user?.role !== 'ADMIN') {
        setSnackbar({
          open: true,
          message: '⚠️ Herramienta exclusiva de administradores',
          severity: 'warning',
        });
        return;
      }
      navigate('/admin/preguntas');
      return;
    }
    navigate(path);
  };

  const menuItems = [
    {
      title: 'Crear Test',
      description: 'Elige oposición y configura tu test',
      path: '/oposiciones',
      icon: '📝',
    },
    {
      title: 'Dashboard Anki',
      description: 'Repaso con repetición espaciada',
      path: '/anki',
      icon: '🔄',
    },
    {
      title: 'Mis Estadísticas',
      description: 'Visualiza tu progreso y estadísticas',
      path: '/estadisticas',
      icon: '📊',
    },
    {
      title: 'Preguntas',
      description: 'Gestiona las preguntas del sistema',
      path: '/preguntas',
      icon: '❓',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" component="h1">
              Bienvenido, {user?.nombre}! 👋
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
              {user?.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Limpiar caché de tests antiguos">
              <IconButton 
                color="warning" 
                onClick={handleClearCache}
                size="small"
              >
                <DeleteSweepIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="error"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  },
                }}
                onClick={() => handleNavigate(item.path)}
              >
                <CardContent>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    {item.icon}
                  </Typography>
                  <Typography variant="h6" component="div">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={4000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};
