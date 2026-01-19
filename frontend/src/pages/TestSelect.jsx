import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { oposicionesService } from '../services/apiServices';

export const TestSelect = () => {
  const [oposiciones, setOposiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOposiciones();
  }, []);

  const loadOposiciones = async () => {
    try {
      setLoading(true);
      const response = await oposicionesService.getAll();
      const data = response.data?.oposiciones || response.oposiciones || [];
      setOposiciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar las oposiciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (oposiciones.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            📋 No hay oposiciones disponibles
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Primero debes crear oposiciones con temas y preguntas publicadas.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📚 Selecciona una Oposición
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Elige una oposición para comenzar tu test personalizado
        </Typography>

        <Grid container spacing={3}>
          {oposiciones.map((oposicion) => (
            <Grid item xs={12} sm={6} md={4} key={oposicion.id}>
              <Card
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {oposicion.nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    <strong>Código:</strong> {oposicion.codigo}
                  </Typography>
                  {oposicion.descripcion && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {oposicion.descripcion}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      label={`${oposicion._count?.temas || 0} temas`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${oposicion._count?.preguntas || 0} preguntas`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/test/create?oposicionId=${oposicion.id}`)}
                  >
                    Crear Test
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
