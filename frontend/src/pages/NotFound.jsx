import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: 80, fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
          Página no encontrada
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'textSecondary' }}>
          La página que buscas no existe. Regresa al inicio.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </Button>
      </Box>
    </Container>
  );
};
