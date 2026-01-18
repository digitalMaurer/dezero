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
} from '@mui/material';
import { oposicionesService } from '../services/apiServices';

export const Oposiciones = () => {
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
      setOposiciones(response.data.oposiciones);
    } catch (err) {
      setError('Error al cargar las oposiciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOposicion = (oposicionId) => {
    navigate(`/test/create?oposicionId=${oposicionId}`);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            📚 Oposiciones Disponibles
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Selecciona una oposición para comenzar a practicar
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {oposiciones.map((oposicion) => (
            <Grid item xs={12} sm={6} md={4} key={oposicion.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {oposicion.nombre}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    Código: {oposicion.codigo}
                  </Typography>
                  <Typography variant="body2">
                    {oposicion.descripcion}
                  </Typography>
                  {oposicion.temas && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="primary">
                        📖 {oposicion.temas.length} temas disponibles
                      </Typography>
                      <Typography variant="body2" color="secondary">
                        ❓{' '}
                        {oposicion.temas.reduce(
                          (sum, tema) => sum + (tema._count?.preguntas || 0),
                          0
                        )}{' '}
                        preguntas
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleSelectOposicion(oposicion.id)}
                  >
                    Comenzar Test
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {oposiciones.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No hay oposiciones disponibles
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};
