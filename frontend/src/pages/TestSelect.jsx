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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookIcon from '@mui/icons-material/Book';
import FilterListIcon from '@mui/icons-material/FilterList';
import { oposicionesService } from '../services/apiServices';

export const TestSelect = () => {
  const [oposiciones, setOposiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('ALEATORIO');
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

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const handleSelectOposicion = (oposicionId) => {
    navigate(`/test/create?oposicionId=${oposicionId}&mode=${mode}`);
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
          📚 Selecciona Modo de Test
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Elige el tipo de test que deseas realizar
        </Typography>

        {/* Selector de Modo */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            aria-label="modo de test"
            color="primary"
            size="large"
          >
            <ToggleButton value="ALEATORIO" aria-label="aleatorio">
              <CasinoIcon sx={{ mr: 1 }} />
              Aleatorio
            </ToggleButton>
            <ToggleButton value="ANKI" aria-label="anki">
              <RepeatIcon sx={{ mr: 1 }} />
              Anki (Repaso)
            </ToggleButton>
            <ToggleButton value="REPASO" aria-label="repaso">
              <BookIcon sx={{ mr: 1 }} />
              Repaso
            </ToggleButton>
            <ToggleButton value="FILTRADO" aria-label="filtrado">
              <FilterListIcon sx={{ mr: 1 }} />
              Filtrado
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Descripción del modo */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          {mode === 'ALEATORIO' && (
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              <strong>Modo Aleatorio:</strong> Preguntas seleccionadas aleatoriamente de los temas elegidos.
            </Alert>
          )}
          {mode === 'ANKI' && (
            <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto' }}>
              <strong>Modo Anki:</strong> Solo preguntas que necesitan repaso según tu historial de respuestas.
            </Alert>
          )}
          {mode === 'REPASO' && (
            <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto' }}>
              <strong>Modo Repaso:</strong> Preguntas vencidas o que requieren revisión.
            </Alert>
          )}
          {mode === 'FILTRADO' && (
            <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
              <strong>Modo Filtrado:</strong> Filtra por "más mal respondidas", "última respuesta errónea", etc.
            </Alert>
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h5" gutterBottom>
          Selecciona una Oposición
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
                    onClick={() => handleSelectOposicion(oposicion.id)}
                  >
                    Crear Test {mode === 'ALEATORIO' ? '🎲' : mode === 'ANKI' ? '🔄' : mode === 'REPASO' ? '📖' : '🎯'}
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
