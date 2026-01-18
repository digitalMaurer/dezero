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
} from '@mui/material';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Oposiciones',
      description: 'Gestiona todas las oposiciones disponibles',
      path: '/oposiciones',
      icon: '📋',
    },
    {
      title: 'Realizar Test',
      description: 'Realiza un test personalizado',
      path: '/test',
      icon: '✍️',
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
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </Button>
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
                onClick={() => navigate(item.path)}
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
      </Box>
    </Container>
  );
};
