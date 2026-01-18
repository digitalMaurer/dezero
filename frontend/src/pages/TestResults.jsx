import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { testsService } from '../services/apiServices';

export const TestResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Si no, cargar del backend
        const response = await testsService.getAttempt(attemptId);
        setResults(response.data);
      }
    } catch (err) {
      setError('Error al cargar los resultados');
      console.error(err);
    } finally {
      setLoading(false);
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
                      label={respuesta.pregunta.dificultad}
                      size="small"
                      sx={{ ml: 2 }}
                      color={
                        respuesta.pregunta.dificultad === 'EASY'
                          ? 'success'
                          : respuesta.pregunta.dificultad === 'MEDIUM'
                          ? 'warning'
                          : 'error'
                      }
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
                </>
              )}
            </Paper>
          ))}
      </Box>
    </Container>
  );
};
