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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookIcon from '@mui/icons-material/Book';
import FilterListIcon from '@mui/icons-material/FilterList';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { oposicionesService, testsService } from '../services/apiServices';

export const TestSelect = () => {
  const [oposiciones, setOposiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('ALEATORIO');
  const [manicomioSetup, setManicomioSetup] = useState({
    selectedOposicionId: null,
    selectedTemasIds: [],
    streakTarget: 30,
    submitting: false,
  });
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
    if (mode === 'MANICOMIO') {
      // Para MANICOMIO, mostrar form inline en lugar de ir a TestCreate
      setManicomioSetup((prev) => ({
        ...prev,
        selectedOposicionId: oposicionId,
        selectedTemasIds: [], // Reset temas
      }));
    } else {
      navigate(`/test/create?oposicionId=${oposicionId}&mode=${mode}`);
    }
  };

  const handleManicomioCreateTest = async () => {
    if (!manicomioSetup.selectedOposicionId) {
      setError('Selecciona una oposición');
      return;
    }

    setManicomioSetup((prev) => ({ ...prev, submitting: true }));
    setError(null);

    try {
      const testData = {
        oposicionId: manicomioSetup.selectedOposicionId,
        mode: 'MANICOMIO',
        streakTarget: manicomioSetup.streakTarget,
      };

      if (manicomioSetup.selectedTemasIds.length > 0) {
        testData.temaIds = manicomioSetup.selectedTemasIds;
      }

      const response = await testsService.createAttempt(testData);
      const attemptId = response.data.attemptId;

      // Guardar los datos del test en localStorage
      localStorage.setItem(
        `test_${attemptId}`,
        JSON.stringify(response.data)
      );

      // Ir directamente a TestTake
      navigate(`/test/${attemptId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al crear el test'
      );
      console.error(err);
    } finally {
      setManicomioSetup((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleManicomioCancel = () => {
    setManicomioSetup({
      selectedOposicionId: null,
      selectedTemasIds: [],
      streakTarget: 30,
      submitting: false,
    });
  };

  const handleManicomioTemaToggle = (temaId) => {
    setManicomioSetup((prev) => ({
      ...prev,
      selectedTemasIds: prev.selectedTemasIds.includes(temaId)
        ? prev.selectedTemasIds.filter((id) => id !== temaId)
        : [...prev.selectedTemasIds, temaId],
    }));
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
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          📚 Crear Test Personalizado
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 5 }}>
          Elige el modo de test y la oposición
        </Typography>

        {/* Selector de Modo con Cards */}
        <Paper elevation={3} sx={{ p: 4, mb: 5 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            🎯 Paso 1: Selecciona el Modo de Test
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleModeChange(null, 'ALEATORIO')}
                sx={{
                  cursor: 'pointer',
                  border: mode === 'ALEATORIO' ? '3px solid #1976d2' : '1px solid #ddd',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CasinoIcon sx={{ fontSize: 50, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    🎲 Aleatorio
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Preguntas al azar de los temas seleccionados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleModeChange(null, 'ANKI')}
                sx={{
                  cursor: 'pointer',
                  border: mode === 'ANKI' ? '3px solid #2e7d32' : '1px solid #ddd',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <RepeatIcon sx={{ fontSize: 50, color: '#2e7d32', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    🔄 Anki
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Solo preguntas vencidas para repasar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleModeChange(null, 'REPASO')}
                sx={{
                  cursor: 'pointer',
                  border: mode === 'REPASO' ? '3px solid #ed6c02' : '1px solid #ddd',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <BookIcon sx={{ fontSize: 50, color: '#ed6c02', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    📖 Repaso
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Preguntas pendientes de revisar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleModeChange(null, 'FILTRADO')}
                sx={{
                  cursor: 'pointer',
                  border: mode === 'FILTRADO' ? '3px solid #d32f2f' : '1px solid #ddd',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <FilterListIcon sx={{ fontSize: 50, color: '#d32f2f', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    🎯 Filtrado
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Filtros avanzados (errores, dificultad, etc.)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleModeChange(null, 'MANICOMIO')}
                sx={{
                  cursor: 'pointer',
                  border: mode === 'MANICOMIO' ? '3px solid #f50057' : '1px solid #ddd',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <FlashOnIcon sx={{ fontSize: 50, color: '#f50057', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    🌀 Manicomio
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Preguntas seguidas sin listar. Personaliza tu objetivo de aciertos.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Descripción del modo */}
          <Box sx={{ mt: 3 }}>
            {mode === 'ALEATORIO' && (
              <Alert severity="info">
                <strong>Modo Aleatorio:</strong> Las preguntas se seleccionan aleatoriamente de los temas que elijas. Ideal para práctica general.
              </Alert>
            )}
            {mode === 'ANKI' && (
              <Alert severity="success">
                <strong>Modo Anki (Repetición Espaciada):</strong> Solo verás preguntas que necesiten repaso según el algoritmo Anki. Las preguntas mal respondidas aparecen más frecuentemente.
              </Alert>
            )}
            {mode === 'REPASO' && (
              <Alert severity="warning">
                <strong>Modo Repaso:</strong> Preguntas vencidas o que requieren revisión prioritaria.
              </Alert>
            )}
            {mode === 'FILTRADO' && (
              <Alert severity="error">
                <strong>Modo Filtrado Avanzado:</strong> En el siguiente paso podrás elegir filtros específicos como "más mal respondidas", "última respuesta errónea", "nunca respondidas", etc.
              </Alert>
            )}
            {mode === 'MANICOMIO' && (
              <Alert severity="error">
                <strong>Modo Manicomio:</strong> Preguntas seguidas sin listar. Sin dejar en blanco. Personaliza tu objetivo de aciertos seguidos. Feedback inmediato.
              </Alert>
            )}
          </Box>
        </Paper>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          📋 Paso 2: Selecciona una Oposición
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

        {/* MANICOMIO: Form inline para configurar temas y streak */}
        {mode === 'MANICOMIO' && manicomioSetup.selectedOposicionId && (
          <Paper elevation={3} sx={{ p: 4, mt: 4, bgcolor: '#fff5f6' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              🌀 Configurar Modo Manicomio
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {(() => {
              const selectedOposicion = oposiciones.find(
                (o) => o.id === manicomioSetup.selectedOposicionId
              );
              const temas = selectedOposicion?.temas || [];

              return (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      📚 Temas (opcional - dejar vacío para todos)
                    </Typography>
                    <FormGroup row>
                      {temas.map((tema) => (
                        <FormControlLabel
                          key={tema.id}
                          control={
                            <Checkbox
                              checked={manicomioSetup.selectedTemasIds.includes(tema.id)}
                              onChange={() => handleManicomioTemaToggle(tema.id)}
                            />
                          }
                          label={`${tema.nombre} (${tema._count?.preguntas || 0})`}
                        />
                      ))}
                    </FormGroup>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>🎯 Aciertos seguidos para terminar</InputLabel>
                      <Select
                        value={manicomioSetup.streakTarget}
                        onChange={(e) =>
                          setManicomioSetup((prev) => ({
                            ...prev,
                            streakTarget: e.target.value,
                          }))
                        }
                        label="🎯 Aciertos seguidos para terminar"
                      >
                        <MenuItem value={10}>10 aciertos</MenuItem>
                        <MenuItem value={20}>20 aciertos</MenuItem>
                        <MenuItem value={30}>30 aciertos (recomendado)</MenuItem>
                        <MenuItem value={50}>50 aciertos</MenuItem>
                        <MenuItem value={100}>100 aciertos (Legión)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleManicomioCreateTest}
                      disabled={manicomioSetup.submitting}
                      sx={{ flex: 1 }}
                    >
                      {manicomioSetup.submitting ? 'Creando...' : '🚀 Comenzar Manicomio'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleManicomioCancel}
                      disabled={manicomioSetup.submitting}
                    >
                      Cancelar
                    </Button>
                  </Stack>
                </>
              );
            })()}
          </Paper>
        )}

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
