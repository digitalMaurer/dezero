import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDifficultyLabel, getDifficultyColor } from '../utils/difficulty';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  ButtonGroup,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RepeatIcon from '@mui/icons-material/Repeat';
import { testsService, ankiService } from '../services/apiServices';

export const TestResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ankiUpdating, setAnkiUpdating] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Si vienen resultados desde el submit, usarlos
      if (location.state?.results) {
        setResults(location.state.results);
      } else {
        // Si no, cargar del backend y normalizar al formato de resultados
        const response = await testsService.getAttempt(attemptId);
        const attempt = response.data?.attempt || response.data;
        if (!attempt) throw new Error('No se encontró el intento');

        const preguntas = (attempt.test?.questions || []).map((q) => q.pregunta);
        const respuestasMap = new Map(
          (attempt.respuestas || []).map((r) => [r.preguntaId, r])
        );

        const respuestasDetalladas = preguntas.map((p) => {
          const r = respuestasMap.get(p.id);
          return {
            preguntaId: p.id,
            respuestaUsuario: r?.respuestaUsuario || null,
            esCorrecta: Boolean(r?.esCorrecta),
            pregunta: {
              id: p.id,
              titulo: p.titulo,
              enunciado: p.enunciado,
              opcionA: p.opcionA,
              opcionB: p.opcionB,
              opcionC: p.opcionC,
              opcionD: p.opcionD,
              dificultad: p.dificultad,
              respuestaCorrecta: p.respuestaCorrecta,
              explicacion: p.explicacion,
            },
          };
        });

        const totalPreguntas = attempt.test?.cantidadPreguntas || preguntas.length;
        const respondidas = attempt.respuestas?.length || 0;
        const respuestasCorrectas = (attempt.respuestas || []).filter((r) => r.esCorrecta).length;
        const respuestasIncorrectas = Math.max(respondidas - respuestasCorrectas, 0);
        const respuestasEnBlanco = Math.max(totalPreguntas - respondidas, 0);

        setResults({
          totalPreguntas,
          respuestasCorrectas,
          respuestasIncorrectas,
          respuestasEnBlanco,
          respuestas: respuestasDetalladas,
        });
      }
    } catch (err) {
      setError('Error al cargar los resultados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnkiGrade = async (preguntaId, grade, esCorrecta) => {
    // Si la pregunta fue mal respondida, forzar a "OTRA_VEZ"
    const finalGrade = esCorrecta ? grade : 'OTRA_VEZ';

    try {
      setAnkiUpdating((prev) => ({ ...prev, [preguntaId]: true }));
      await ankiService.updateQuestionGrade(preguntaId, finalGrade);
      
      const gradeLabels = {
        'OTRA_VEZ': 'Otra vez (1 día)',
        'DIFICIL': 'Difícil (3 días)',
        'BIEN': 'Bien (10 días)',
        'FACIL': 'Fácil (20 días)',
      };
      
      setSnackbar({
        open: true,
        message: `✅ Pregunta marcada como: ${gradeLabels[finalGrade]}`,
      });
    } catch (err) {
      console.error('Error al actualizar Anki:', err);
      setSnackbar({
        open: true,
        message: '❌ Error al actualizar repaso Anki',
      });
    } finally {
      setAnkiUpdating((prev) => ({ ...prev, [preguntaId]: false }));
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

  if (error || !results) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'No se pudieron cargar los resultados'}
        </Alert>
      </Container>
    );
  }

  const porcentaje = Math.round(
    (results.respuestasCorrectas / results.totalPreguntas) * 100
  );

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Resultados del Test
        </Typography>

        {/* Resumen del Test */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h2" color={getScoreColor(porcentaje)} gutterBottom>
            {porcentaje}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            {results.respuestasCorrectas} de {results.totalPreguntas} correctas
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Correctas
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {results.respuestasCorrectas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Incorrectas
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {results.respuestasIncorrectas}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    En Blanco
                  </Typography>
                  <Typography variant="h5" color="text.secondary">
                    {results.respuestasEnBlanco}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Volver al Dashboard
            </Button>
            <Button variant="outlined" onClick={() => navigate('/estadisticas')}>
              Ver Estadísticas
            </Button>
          </Box>
        </Paper>

        {/* Detalle de respuestas */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Detalle de Respuestas
        </Typography>

        {results.respuestas &&
          results.respuestas.map((respuesta, index) => (
            <Paper
              key={respuesta.id || index}
              elevation={2}
              sx={{ p: 3, mb: 2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  Pregunta {index + 1}
                  {respuesta.pregunta?.dificultad && (
                    <Chip
                      label={getDifficultyLabel(respuesta.pregunta.dificultad)}
                      size="small"
                      sx={{ ml: 2 }}
                      color={getDifficultyColor(respuesta.pregunta.dificultad)}
                    />
                  )}
                </Typography>
                {respuesta.esCorrecta ? (
                  <CheckCircleIcon color="success" fontSize="large" />
                ) : (
                  <CancelIcon color="error" fontSize="large" />
                )}
              </Box>

              {respuesta.pregunta && (
                <>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {respuesta.pregunta.enunciado}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color={
                        respuesta.respuestaUsuario === 'A'
                          ? respuesta.esCorrecta
                            ? 'success.main'
                            : 'error.main'
                          : respuesta.pregunta.respuestaCorrecta === 'A'
                          ? 'success.main'
                          : 'inherit'
                      }
                      sx={{
                        fontWeight:
                          respuesta.respuestaUsuario === 'A' ||
                          respuesta.pregunta.respuestaCorrecta === 'A'
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      A) {respuesta.pregunta.opcionA}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        respuesta.respuestaUsuario === 'B'
                          ? respuesta.esCorrecta
                            ? 'success.main'
                            : 'error.main'
                          : respuesta.pregunta.respuestaCorrecta === 'B'
                          ? 'success.main'
                          : 'inherit'
                      }
                      sx={{
                        fontWeight:
                          respuesta.respuestaUsuario === 'B' ||
                          respuesta.pregunta.respuestaCorrecta === 'B'
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      B) {respuesta.pregunta.opcionB}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        respuesta.respuestaUsuario === 'C'
                          ? respuesta.esCorrecta
                            ? 'success.main'
                            : 'error.main'
                          : respuesta.pregunta.respuestaCorrecta === 'C'
                          ? 'success.main'
                          : 'inherit'
                      }
                      sx={{
                        fontWeight:
                          respuesta.respuestaUsuario === 'C' ||
                          respuesta.pregunta.respuestaCorrecta === 'C'
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      C) {respuesta.pregunta.opcionC}
                    </Typography>
                    {respuesta.pregunta.opcionD && (
                      <Typography
                        variant="body2"
                        color={
                          respuesta.respuestaUsuario === 'D'
                            ? respuesta.esCorrecta
                              ? 'success.main'
                              : 'error.main'
                            : respuesta.pregunta.respuestaCorrecta === 'D'
                            ? 'success.main'
                            : 'inherit'
                        }
                        sx={{
                          fontWeight:
                            respuesta.respuestaUsuario === 'D' ||
                            respuesta.pregunta.respuestaCorrecta === 'D'
                              ? 'bold'
                              : 'normal',
                        }}
                      >
                        D) {respuesta.pregunta.opcionD}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Tu respuesta:{' '}
                      <strong>
                        {respuesta.respuestaUsuario || 'Sin responder'}
                      </strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Respuesta correcta:{' '}
                      <strong style={{ color: 'green' }}>
                        {respuesta.pregunta.respuestaCorrecta}
                      </strong>
                    </Typography>
                  </Box>

                  {respuesta.pregunta.explicacion && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'info.lighter',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="info.dark">
                        <strong>Explicación:</strong>{' '}
                        {respuesta.pregunta.explicacion}
                      </Typography>
                    </Box>
                  )}

                  {/* Botones Anki */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RepeatIcon color="action" />
                    <Typography variant="body2" color="textSecondary">
                      <strong>Repaso Anki:</strong>
                    </Typography>
                    {respuesta.esCorrecta ? (
                      <ButtonGroup size="small" disabled={ankiUpdating[respuesta.pregunta.id]}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleAnkiGrade(respuesta.pregunta.id, 'OTRA_VEZ', true)}
                        >
                          Otra vez
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => handleAnkiGrade(respuesta.pregunta.id, 'DIFICIL', true)}
                        >
                          Difícil
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => handleAnkiGrade(respuesta.pregunta.id, 'BIEN', true)}
                        >
                          Bien
                        </Button>
                        <Button
                          variant="outlined"
                          color="info"
                          onClick={() => handleAnkiGrade(respuesta.pregunta.id, 'FACIL', true)}
                        >
                          Fácil
                        </Button>
                      </ButtonGroup>
                    ) : (
                      <Chip
                        icon={<RepeatIcon />}
                        label="Automático: Otra vez (1 día)"
                        color="error"
                        size="small"
                        onClick={() => handleAnkiGrade(respuesta.pregunta.id, 'OTRA_VEZ', false)}
                      />
                    )}
                  </Box>
                </>
              )}
            </Paper>
          ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Container>
  );
};
