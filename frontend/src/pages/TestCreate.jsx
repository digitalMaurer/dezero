import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
} from '@mui/material';
import { temasService, testsService } from '../services/apiServices';

export const TestCreate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oposicionId = searchParams.get('oposicionId');
  const mode = searchParams.get('mode') || 'ALEATORIO';

  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    temaIds: [],
    cantidad: 10,
    dificultad: '',
    mode: mode,
    // Filtros avanzados
    filtroTipo: '', // MAS_ERRONEAS, ULTIMA_ERRONEA, NUNCA_RESPONDIDAS, etc.
    filtroOrden: 'ALEATORIO', // ALEATORIO, DIFICULTAD_ASC, DIFICULTAD_DESC
  });

  useEffect(() => {
    if (oposicionId) {
      loadTemas();
    }
  }, [oposicionId]);

  const loadTemas = async () => {
    try {
      setLoading(true);
      const response = await temasService.getAll(oposicionId);
      setTemas(response.data.temas);
    } catch (err) {
      setError('Error al cargar los temas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemaToggle = (temaId) => {
    setFormData((prev) => {
      const newTemaIds = prev.temaIds.includes(temaId)
        ? prev.temaIds.filter((id) => id !== temaId)
        : [...prev.temaIds, temaId];
      return {
        ...prev,
        temaIds: newTemaIds,
      };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      temaIds: prev.temaIds.length === temas.length ? [] : temas.map((t) => t.id),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const testData = {
        oposicionId,
        mode: formData.mode,
      };

      // Si cantidad tiene valor, enviarlo
      if (formData.cantidad && formData.cantidad.trim() !== '') {
        testData.cantidad = parseInt(formData.cantidad);
      }

      // Si hay temas seleccionados, pasarlos como array
      if (formData.temaIds.length > 0) {
        testData.temaIds = formData.temaIds;
      }

      if (formData.dificultad) {
        testData.dificultad = formData.dificultad;
      }

      // Agregar filtros si está en modo FILTRADO
      if (formData.mode === 'FILTRADO') {
        if (formData.filtroTipo) {
          testData.filtroTipo = formData.filtroTipo;
        }
        testData.filtroOrden = formData.filtroOrden;
      }

      const response = await testsService.createAttempt(testData);
      const attemptId = response.data.attemptId;

      // Guardar los datos del test en localStorage para acceder en TestTake
      localStorage.setItem(
        `test_${attemptId}`,
        JSON.stringify(response.data)
      );

      // Redirigir a la página del test
      navigate(`/test/${attemptId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al crear el test'
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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

  const selectedTemasData = temas.filter((t) => formData.temaIds.includes(t.id));
  const totalPreguntasSeleccionadas = selectedTemasData.reduce(
    (sum, t) => sum + (t._count?.preguntas || 0),
    0
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          ✍️ Crear Nuevo Test
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Configura tu test personalizado
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Modo de Test */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Modo de Test</InputLabel>
              <Select
                name="mode"
                value={formData.mode}
                label="Modo de Test"
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    mode: value,
                    // Para simulacro fijamos 100 preguntas por defecto
                    cantidad: value === 'SIMULACRO_EXAMEN' ? '100' : prev.cantidad,
                  }));
                }}
              >
                <MenuItem value="ALEATORIO">Aleatorio</MenuItem>
                <MenuItem value="FILTRADO">Filtrado</MenuItem>
                <MenuItem value="REPASO">Repaso</MenuItem>
                <MenuItem value="ANKI">Anki (vencidas)</MenuItem>
                <MenuItem value="SIMULACRO_EXAMEN">Simulacro examen oficial</MenuItem>
              </Select>
            </FormControl>

            {/* Selección de Temas */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              📚 Selecciona los temas
            </Typography>

            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.temaIds.length === temas.length && temas.length > 0}
                    indeterminate={
                      formData.temaIds.length > 0 && formData.temaIds.length < temas.length
                    }
                    onChange={handleSelectAll}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Seleccionar todos los temas
                  </Typography>
                }
              />
            </Box>

            <FormGroup sx={{ mb: 3 }}>
              {temas.map((tema) => (
                <FormControlLabel
                  key={tema.id}
                  control={
                    <Checkbox
                      checked={formData.temaIds.includes(tema.id)}
                      onChange={() => handleTemaToggle(tema.id)}
                    />
                  }
                  label={`${tema.nombre} (${tema._count?.preguntas || 0} preguntas)`}
                />
              ))}
            </FormGroup>

            {/* Resumen de selección */}
            {formData.temaIds.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Seleccionado:</strong> {formData.temaIds.length} tema(s) -{' '}
                  {totalPreguntasSeleccionadas} preguntas disponibles
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selectedTemasData.map((tema) => (
                    <Chip
                      key={tema.id}
                      label={`${tema.nombre} (${tema._count?.preguntas || 0})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              fullWidth
              type="text"
              name="cantidad"
              label="Cantidad de preguntas"
              placeholder={formData.mode === 'SIMULACRO_EXAMEN' ? 'Por defecto 100' : 'Dejar vacío para todas las preguntas'}
              value={formData.cantidad}
              onChange={handleChange}
              sx={{ mb: 3 }}
              disabled={formData.mode === 'SIMULACRO_EXAMEN'}
              helperText={
                formData.mode === 'SIMULACRO_EXAMEN'
                  ? 'Simulacro intenta generar 100 preguntas repartidas entre los temas seleccionados'
                  : `Máximo disponible: ${
                      formData.temaIds.length > 0 ? totalPreguntasSeleccionadas : 'Todos los temas'
                    } preguntas`
              }
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Dificultad (opcional)</InputLabel>
              <Select
                name="dificultad"
                value={formData.dificultad}
                onChange={handleChange}
                label="Dificultad (opcional)"
              >
                <MenuItem value="">
                  <em>Todas las dificultades</em>
                </MenuItem>
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="MEDIUM">Media</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
              </Select>
            </FormControl>

            {/* Filtros avanzados solo en modo FILTRADO */}
            {mode === 'FILTRADO' && (
              <>
                <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
                  🎯 Filtros Avanzados
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Tipo de Filtro</InputLabel>
                  <Select
                    name="filtroTipo"
                    value={formData.filtroTipo}
                    onChange={handleChange}
                    label="Tipo de Filtro"
                  >
                    <MenuItem value="">
                      <em>Sin filtro específico</em>
                    </MenuItem>
                    <MenuItem value="MAS_ERRONEAS">
                      ❌ Más veces mal respondidas
                    </MenuItem>
                    <MenuItem value="ULTIMA_ERRONEA">
                      🔴 Última respuesta errónea
                    </MenuItem>
                    <MenuItem value="NUNCA_RESPONDIDAS">
                      ⭕ Nunca respondidas
                    </MenuItem>
                    <MenuItem value="PEOR_PORCENTAJE">
                      📉 Peor porcentaje de acierto
                    </MenuItem>
                    <MenuItem value="MAS_RESPONDIDAS">
                      🔄 Más veces respondidas
                    </MenuItem>
                    <MenuItem value="MENOS_RESPONDIDAS">
                      ⚪ Menos veces respondidas
                    </MenuItem>
                    <MenuItem value="SOLO_INCORRECTAS">
                      ⛔ Solo incorrectas alguna vez
                    </MenuItem>
                    <MenuItem value="REVISION_PENDIENTE">
                      ⏰ Revisión pendiente (Anki)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Orden de preguntas</InputLabel>
                  <Select
                    name="filtroOrden"
                    value={formData.filtroOrden}
                    onChange={handleChange}
                    label="Orden de preguntas"
                  >
                    <MenuItem value="ALEATORIO">🎲 Aleatorio</MenuItem>
                    <MenuItem value="DIFICULTAD_ASC">📈 Dificultad ascendente (fácil → difícil)</MenuItem>
                    <MenuItem value="DIFICULTAD_DESC">📉 Dificultad descendente (difícil → fácil)</MenuItem>
                    <MenuItem value="MAS_ERRORES">❌ Más errores primero</MenuItem>
                    <MenuItem value="MENOS_ERRORES">✅ Menos errores primero</MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Los filtros se aplican a las preguntas de los temas seleccionados arriba.
                </Alert>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/oposiciones')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={submitting || formData.temaIds.length === 0}
              >
                {submitting ? 'Creando...' : 'Iniciar Test'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
