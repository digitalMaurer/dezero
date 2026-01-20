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
import { temasService, testsService, oposicionesService } from '../services/apiServices';

/**
 * MEJORAS FUTURAS:
 * 1. Extraer renderStep1, renderStep2, renderStep3, renderStep4 a componentes separados en carpeta /components
 * 2. Crear hook personalizado useTestCreateForm() para la lógica del formulario
 * 3. Agregar validación de temas mínimos según el modo (ej: SIMULACRO necesita al menos 5 temas)
 * 4. Cachear oposiciones y temas en context/zustand para evitar re-fetches
 * 5. Agregar historial de tests recientes para quickstart
 * 6. Persistir estado del formulario en localStorage para recuperar en case de recarga
 * 7. Añadir tooltip/help icons explicando cada modo
 * 8. Animaciones de transición entre pasos
 * 9. Progress bar visual del progreso en los pasos
 * 10. Tests unitarios para lógica de selección de temas y modos
 */

export const TestCreate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oposicionIdFromUrl = searchParams.get('oposicionId');
  const modeFromUrl = searchParams.get('mode');

  const [step, setStep] = useState(modeFromUrl ? 2 : 1); // Si viene mode por URL, saltamos al paso 2
  const [temas, setTemas] = useState([]);
  const [oposiciones, setOposiciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    mode: modeFromUrl || '',
    oposicionId: oposicionIdFromUrl || '',
    temaIds: [],
    cantidad: '',
    dificultad: '',
    streakTarget: 30,
    filtroTipo: '',
    filtroOrden: 'ALEATORIO',
  });

  useEffect(() => {
    // Cargar oposiciones cuando estemos en paso 2 sin oposicionId
    if (step === 2 && !formData.oposicionId) {
      loadOposiciones();
    }
    // Cargar temas cuando tengamos oposicionId y estemos en paso 3 o superior
    if (formData.oposicionId && step >= 3 && formData.mode !== 'FAVORITOS') {
      loadTemas();
    }
  }, [step, formData.oposicionId, formData.mode]);

  const loadTemas = async () => {
    try {
      setLoading(true);
      const response = await temasService.getAll(formData.oposicionId);
      setTemas(response.data.temas);
    } catch (err) {
      setError('Error al cargar los temas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOposiciones = async () => {
    try {
      setLoading(true);
      const response = await oposicionesService.getAll();
      setOposiciones(response.data);
    } catch (err) {
      setError('Error al cargar las oposiciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOposicionSelect = (oposicionId) => {
    setFormData((prev) => ({
      ...prev,
      oposicionId,
      temaIds: [], // Limpiar temas al cambiar oposición
    }));
    // Si es FAVORITOS, saltamos al paso 4. Si no, al paso 3 (temas)
    setStep(formData.mode === 'FAVORITOS' ? 4 : 3);
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
        oposicionId: formData.oposicionId,
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

      // Agregar streakTarget si está en modo MANICOMIO
      if (formData.mode === 'MANICOMIO') {
        testData.streakTarget = parseInt(formData.streakTarget);
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

  // Configuración de los modos de test
  const testModes = [
    {
      id: 'ALEATORIO',
      icon: '🎲',
      title: 'Aleatorio',
      description: 'Preguntas aleatorias de los temas seleccionados',
    },
    {
      id: 'FILTRADO',
      icon: '🎯',
      title: 'Filtrado',
      description: 'Filtra por erróneas, nunca vistas, dificultad, etc.',
    },
    {
      id: 'REPASO',
      icon: '📚',
      title: 'Repaso',
      description: 'Repaso general de todas las preguntas',
    },
    {
      id: 'ANKI',
      icon: '🧠',
      title: 'Anki',
      description: 'Repetición espaciada - preguntas pendientes de revisar',
    },
    {
      id: 'SIMULACRO_EXAMEN',
      icon: '📝',
      title: 'Simulacro Examen',
      description: '100 preguntas estilo examen oficial',
    },
    {
      id: 'FAVORITOS',
      icon: '⭐',
      title: 'Favoritos',
      description: 'Solo tus preguntas marcadas como favoritas',
    },
    {
      id: 'MANICOMIO',
      icon: '🔥',
      title: 'Manicomio',
      description: 'Consigue N respuestas correctas seguidas',
    },
  ];

  // PASO 1: Selección de modo
  const renderStep1 = () => (
    <Box>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        🎯 Selecciona el modo de test
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        {testModes.map((mode) => (
          <Paper
            key={mode.id}
            elevation={3}
            sx={{
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                mode: mode.id,
                cantidad: mode.id === 'SIMULACRO_EXAMEN' ? '100' : '',
              }));
              setStep(formData.oposicionId ? 3 : 2);
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {mode.icon}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {mode.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {mode.description}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );

  // PASO 2: Selección de oposición
  const renderStep2 = () => (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          📋 Selecciona la oposición
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Modo seleccionado: <strong>{testModes.find(m => m.id === formData.mode)?.title}</strong>
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {oposiciones.map((oposicion) => (
            <Paper
              key={oposicion.id}
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: formData.oposicionId === oposicion.id ? '2px solid #1976d2' : '2px solid transparent',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => handleOposicionSelect(oposicion.id)}
            >
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {oposicion.nombre}
                </Typography>
                {oposicion._count?.temas && (
                  <Typography variant="body2" color="textSecondary">
                    📚 {oposicion._count.temas} temas
                  </Typography>
                )}
                {oposicion._count?.preguntas && (
                  <Typography variant="body2" color="textSecondary">
                    ❓ {oposicion._count.preguntas} preguntas
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setStep(1)}
        >
          ← Volver
        </Button>
      </Box>
    </Box>
  );

  // PASO 3: Selección de temas
  const renderStep3 = () => (
    <Box>
      {/* Header con información */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          📚 Selecciona los temas
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Modo:</strong> {testModes.find(m => m.id === formData.mode)?.title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Oposición:</strong> {oposiciones.find(o => o.id === formData.oposicionId)?.nombre}
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Checkbox Seleccionar Todos */}
          <Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
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
          </Paper>

          {/* Lista de Temas */}
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
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {tema.nombre}
                    </Typography>
                    <Chip
                      label={`${tema._count?.preguntas || 0} preguntas`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
              />
            ))}
          </FormGroup>

          {/* Resumen de selección */}
          {formData.temaIds.length > 0 && (
            <Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>✅ Seleccionado:</strong> {formData.temaIds.length} tema(s) - {totalPreguntasSeleccionadas} preguntas disponibles
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedTemasData.map((tema) => (
                  <Chip
                    key={tema.id}
                    label={`${tema.nombre} (${tema._count?.preguntas || 0})`}
                    size="small"
                    variant="outlined"
                    onDelete={() => handleTemaToggle(tema.id)}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Botones de navegación */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setStep(2)}
            >
              ← Volver
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setStep(4)}
              disabled={formData.temaIds.length === 0}
            >
              Siguiente →
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  // PASO 4: Configuración específica del modo
  const renderStep4 = () => (
    <Box>
      {/* Header con información */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ⚙️ Configuración del test
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Modo:</strong> {testModes.find(m => m.id === formData.mode)?.title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Oposición:</strong> {oposiciones.find(o => o.id === formData.oposicionId)?.nombre}
          </Typography>
          {formData.mode !== 'FAVORITOS' && (
            <Typography variant="body2" color="textSecondary">
              <strong>Temas:</strong> {formData.temaIds.length}
            </Typography>
          )}
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Configuraciones comunes */}
          {formData.mode !== 'SIMULACRO_EXAMEN' && formData.mode !== 'FAVORITOS' && (
            <TextField
              fullWidth
              type="number"
              name="cantidad"
              label="Cantidad de preguntas"
              placeholder="Dejar vacío para todas"
              value={formData.cantidad}
              onChange={handleChange}
              helperText={
                formData.temaIds.length > 0
                  ? `Máximo disponible: ${totalPreguntasSeleccionadas} preguntas`
                  : 'Dejar vacío cargará TODAS las preguntas disponibles'
              }
            />
          )}

          {formData.mode === 'FAVORITOS' && (
            <TextField
              fullWidth
              type="number"
              name="cantidad"
              label="Cantidad de preguntas (opcional)"
              placeholder="Dejar vacío para todos los favoritos"
              value={formData.cantidad}
              onChange={handleChange}
              helperText="Dejar vacío para cargar todos tus favoritos"
            />
          )}

          {formData.mode === 'SIMULACRO_EXAMEN' && (
            <Alert severity="info">
              📝 El Simulacro intenta generar 100 preguntas repartidas entre los {formData.temaIds.length} tema(s) seleccionado(s)
            </Alert>
          )}

          {/* Dificultad (común para muchos modos) */}
          {formData.mode !== 'ANKI' && formData.mode !== 'SIMULACRO_EXAMEN' && (
            <FormControl fullWidth>
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
          )}

          {formData.mode === 'ANKI' && (
            <Alert severity="info">
              🧠 Se cargarán solo las preguntas pendientes de revisar según tu sistema de repetición espaciada
            </Alert>
          )}

          {/* Filtros avanzados - FILTRADO */}
          {formData.mode === 'FILTRADO' && (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                🎯 Filtros Avanzados
              </Typography>

              <FormControl fullWidth>
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

              <FormControl fullWidth>
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
            </>
          )}

          {/* Streak Target - MANICOMIO */}
          {formData.mode === 'MANICOMIO' && (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                🎯 Configuración de Racha
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Aciertos seguidos para terminar</InputLabel>
                <Select
                  name="streakTarget"
                  value={formData.streakTarget}
                  onChange={handleChange}
                  label="Aciertos seguidos para terminar"
                >
                  <MenuItem value={10}>10 aciertos</MenuItem>
                  <MenuItem value={20}>20 aciertos</MenuItem>
                  <MenuItem value={30}>30 aciertos (por defecto)</MenuItem>
                  <MenuItem value={50}>50 aciertos</MenuItem>
                  <MenuItem value={100}>100 aciertos (Legión)</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="warning">
                ⚠️ Necesitas {formData.streakTarget} respuestas correctas seguidas para completar el test
              </Alert>
            </>
          )}

          {/* Resumen de configuración */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              📋 Resumen de configuración:
            </Typography>
            <Typography variant="caption" display="block">
              • Modo: <strong>{testModes.find(m => m.id === formData.mode)?.title}</strong>
            </Typography>
            <Typography variant="caption" display="block">
              • Preguntas: <strong>{formData.cantidad || 'Todas disponibles'}</strong>
            </Typography>
            {formData.dificultad && (
              <Typography variant="caption" display="block">
                • Dificultad: <strong>{formData.dificultad === 'EASY' ? 'Fácil' : formData.dificultad === 'MEDIUM' ? 'Media' : 'Difícil'}</strong>
              </Typography>
            )}
            {formData.mode === 'MANICOMIO' && (
              <Typography variant="caption" display="block">
                • Objetivo: <strong>{formData.streakTarget} correctas seguidas</strong>
              </Typography>
            )}
            {formData.mode === 'FILTRADO' && formData.filtroTipo && (
              <Typography variant="caption" display="block">
                • Filtro: <strong>{formData.filtroTipo}</strong>
              </Typography>
            )}
          </Paper>

          {/* Botones de navegación */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setStep(formData.mode === 'FAVORITOS' ? 2 : 3)}
              disabled={submitting}
            >
              ← Volver
            </Button>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={submitting}
              sx={{ position: 'relative' }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={24} sx={{ position: 'absolute' }} />
                  <span style={{ visibility: 'hidden' }}>Creando...</span>
                </>
              ) : (
                '🚀 Crear Test'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          ✍️ Crear Nuevo Test
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Paso {step} de 4
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Renderizar paso actual */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </Box>
    </Container>
  );
};
