import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import { testsService, preguntasService } from '../services/apiServices';

export const TestTake = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  
  // Cronómetro
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Revisión antes de enviar
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  
  // Reporte de pregunta
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState(null);
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [attemptId]);

  // Cronómetro (respeta pausa)
  useEffect(() => {
    if (!testData || isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [testData, isPaused]);

  // Auto-guardado de respuestas en localStorage
  useEffect(() => {
    if (testData && Object.keys(respuestas).length > 0) {
      const cacheKey = `test_answers_${attemptId}`;
      localStorage.setItem(cacheKey, JSON.stringify(respuestas));
    }
  }, [respuestas, attemptId, testData]);

  const loadTest = async () => {
    try {
      setLoading(true);
      // Cargar test del localStorage
      const cachedTest = localStorage.getItem(`test_${attemptId}`);
      if (cachedTest) {
        setTestData(JSON.parse(cachedTest));
      } else {
        // Si no está en cache, obtenerlo del backend para poder continuar
        const response = await testsService.getAttempt(attemptId);
        const attempt = response.data?.attempt || response.data;
        if (!attempt || !attempt.test?.questions) {
          setError('No se encontró la información del test');
        } else {
          const preguntas = attempt.test.questions
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((q) => ({
              id: q.pregunta.id,
              titulo: q.pregunta.titulo,
              enunciado: q.pregunta.enunciado,
              opcionA: q.pregunta.opcionA,
              opcionB: q.pregunta.opcionB,
              opcionC: q.pregunta.opcionC,
              opcionD: q.pregunta.opcionD,
              dificultad: q.pregunta.dificultad,
              orden: q.orden,
            }));

          const normalized = {
            attemptId: attempt.id,
            testId: attempt.testId,
            preguntas,
            tiempoInicio: attempt.tiempoInicio,
          };
          localStorage.setItem(`test_${attemptId}`, JSON.stringify(normalized));
          setTestData(normalized);
        }
      }

      // Cargar respuestas guardadas
      const cacheKey = `test_answers_${attemptId}`;
      const savedAnswers = localStorage.getItem(cacheKey);
      if (savedAnswers) {
        setRespuestas(JSON.parse(savedAnswers));
      }
    } catch (err) {
      setError('Error al cargar el test');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (preguntaId, respuesta) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: respuesta,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < testData.preguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Ir directamente a una pregunta
  const handleGoToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Abrir diálogo de revisión
  const handleFinishClick = () => {
    setOpenReviewDialog(true);
  };

  // Reportar pregunta
  const handleReportClick = () => {
    setReportingQuestion(currentQuestion);
    setOpenReportDialog(true);
  };

  // Enviar reporte
  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) {
      alert('Por favor describe el problema con la pregunta');
      return;
    }

    setReportSubmitting(true);

    try {
      await preguntasService.reportQuestion(currentQuestion.id, {
        mensaje: reportMessage,
        attemptId,
      });

      setOpenReportDialog(false);
      setReportMessage('');
      setReportingQuestion(null);
      alert('✅ Pregunta reportada. Gracias por ayudarnos a mejorar.');
    } catch (err) {
      alert('Error al reportar la pregunta');
      console.error(err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Enviar después de revisar
  const handleSubmit = async () => {
    setOpenReviewDialog(false);
    setSubmitting(true);
    setError(null);

    try {
      const respuestasArray = testData.preguntas.map((pregunta) => ({
        preguntaId: pregunta.id,
        respuestaUsuario: respuestas[pregunta.id] || '', // Permitir respuestas en blanco
      }));

      const response = await testsService.submitAttempt(attemptId, respuestasArray);

      // Limpiar caches
      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);

      // Navegar a resultados
      navigate(`/test/results/${attemptId}`, {
        state: { results: response.data },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el test');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear tiempo
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  if (!testData || !testData.preguntas || testData.preguntas.length === 0) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          No se pudo cargar el test
        </Alert>
      </Container>
    );
  }

  const currentQuestion = testData.preguntas[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.preguntas.length) * 100;
  const respondidas = Object.keys(respuestas).length;
  const noRespondidas = testData.preguntas.length - respondidas;
  
  // Calcular tiempo estimado (promedio 2 min por pregunta)
  const tiempoEstimado = testData.preguntas.length * 120; // 2 minutos por pregunta
  const tiempoRestante = tiempoEstimado - elapsedTime;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header con cronómetro y pausa */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              ✍️ Test en Progreso
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pregunta {currentQuestionIndex + 1} de {testData.preguntas.length}
            </Typography>
          </Box>

          {/* Cronómetro con pausa */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Paper
              sx={{
                p: 2,
                bgcolor: isPaused ? 'warning.main' : 'primary.main',
                color: 'white',
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                ⏱️ {formatTime(elapsedTime)}
              </Typography>
              <Typography variant="caption">
                {isPaused ? 'PAUSADO' : 'En ejecución'}
              </Typography>
            </Paper>

            <Tooltip title={isPaused ? 'Reanudar' : 'Pausar'}>
              <IconButton
                onClick={() => setIsPaused(!isPaused)}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
              </IconButton>
            </Tooltip>

            {/* Tiempo estimado */}
            <Paper
              sx={{
                p: 2,
                bgcolor: tiempoRestante < 0 ? 'error.main' : 'success.main',
                color: 'white',
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                ⏳ {formatTime(Math.max(0, tiempoRestante))}
              </Typography>
              <Typography variant="caption">Tiempo restante (est.)</Typography>
            </Paper>
          </Box>
        </Box>

        {/* Barra de progreso */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progreso</Typography>
            <Chip
              label={currentQuestion.dificultad}
              color={
                currentQuestion.dificultad === 'EASY'
                  ? 'success'
                  : currentQuestion.dificultad === 'MEDIUM'
                  ? 'warning'
                  : 'error'
              }
              size="small"
            />
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Pregunta actual */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {currentQuestion.titulo}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
                {currentQuestion.enunciado}
              </Typography>

              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={respuestas[currentQuestion.id] || ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                >
                  <FormControlLabel
                    value="A"
                    control={<Radio />}
                    label={`A) ${currentQuestion.opcionA}`}
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    value="B"
                    control={<Radio />}
                    label={`B) ${currentQuestion.opcionB}`}
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    value="C"
                    control={<Radio />}
                    label={`C) ${currentQuestion.opcionC}`}
                    sx={{ mb: 2 }}
                  />
                  {currentQuestion.opcionD && (
                    <FormControlLabel
                      value="D"
                      control={<Radio />}
                      label={`D) ${currentQuestion.opcionD}`}
                      sx={{ mb: 2 }}
                    />
                  )}
                  <FormControlLabel
                    value=""
                    control={<Radio />}
                    label="Dejar en blanco"
                    sx={{ mb: 2, fontStyle: 'italic', opacity: 0.7 }}
                  />
                </RadioGroup>
              </FormControl>

              {/* Botones de navegación + reportar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    ⬅️ Anterior
                  </Button>

                  {currentQuestionIndex === testData.preguntas.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleFinishClick}
                    disabled={submitting}
                    size="large"
                  >
                    ✅ Finalizar Test
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Siguiente ➡️
                  </Button>
                )}                </Box>

                <Tooltip title="Reportar problema con esta pregunta">
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<FlagIcon />}
                    onClick={handleReportClick}
                    size="small"
                  >
                    Reportar
                  </Button>
                </Tooltip>              </Box>
            </Paper>
          </Grid>

          {/* Sidebar: Mapa de preguntas + resumen */}
          <Grid item xs={12} md={4}>
            {/* Resumen */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📊 Resumen
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Respondidas:</Typography>
                    <Chip
                      label={respondidas}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Sin responder:</Typography>
                    <Chip
                      label={noRespondidas}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Mapa de preguntas */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  🗺️ Mapa de Preguntas (por dificultad)
                </Typography>
                <Grid container spacing={1}>
                  {testData.preguntas.map((pregunta, index) => {
                    const isAnswered = respuestas.hasOwnProperty(pregunta.id);
                    const isCurrent = index === currentQuestionIndex;
                    
                    let bgColor = 'inherit';
                    if (isCurrent) {
                      bgColor = 'primary.main';
                    } else if (pregunta.dificultad === 'EASY') {
                      bgColor = isAnswered ? 'success.light' : 'success.lighter';
                    } else if (pregunta.dificultad === 'MEDIUM') {
                      bgColor = isAnswered ? 'warning.light' : 'warning.lighter';
                    } else if (pregunta.dificultad === 'HARD') {
                      bgColor = isAnswered ? 'error.light' : 'error.lighter';
                    }

                    return (
                      <Grid item xs={3} key={pregunta.id}>
                        <Tooltip title={`${pregunta.dificultad} - ${isAnswered ? 'Respondida' : 'Sin responder'}`}>
                          <Button
                            fullWidth
                            variant={isCurrent ? 'contained' : 'outlined'}
                            color={
                              isCurrent ? 'primary' : 
                              pregunta.dificultad === 'EASY' ? 'success' :
                              pregunta.dificultad === 'MEDIUM' ? 'warning' :
                              'error'
                            }
                            size="small"
                            onClick={() => handleGoToQuestion(index)}
                            sx={{
                              minHeight: '45px',
                              fontSize: '0.75rem',
                              fontWeight: isCurrent || isAnswered ? 'bold' : 'normal',
                            }}
                          >
                            {isAnswered ? '✓' : '—'}
                            <br />
                            {index + 1}
                          </Button>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ display: 'block', mt: 2 }}
                >
                  ✓ = Respondida | — = Sin responder
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Diálogo de revisión antes de enviar */}
        <Dialog
          open={openReviewDialog}
          onClose={() => setOpenReviewDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>📋 Revisar Antes de Enviar</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                Estás a punto de finalizar el test.
              </Typography>
              <Stack spacing={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Respondidas:</strong> {respondidas} / {testData.preguntas.length}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Tiempo:</strong> {formatTime(elapsedTime)}
                    </Typography>
                  </CardContent>
                </Card>

                {noRespondidas > 0 && (
                  <Alert severity="warning">
                    ⚠️ Tienes {noRespondidas} pregunta(s) sin responder. Serán contadas como
                    incorrectas.
                  </Alert>
                )}

                <Typography variant="body2" color="textSecondary">
                  ¿Deseas continuar y finalizar el test?
                </Typography>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Volver a Revisar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="success"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Confirmar y Finalizar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para reportar pregunta */}
        <Dialog
          open={openReportDialog}
          onClose={() => setOpenReportDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>🚩 Reportar Pregunta</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Cuéntanos qué problema tiene esta pregunta. Puede ser un error en el enunciado, 
                respuesta incorrecta, ambigüedad, etc.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Describe el problema..."
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="textSecondary">
                Tu reporte es anónimo y nos ayuda a mejorar la calidad del sistema.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenReportDialog(false);
                setReportMessage('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReport}
              variant="contained"
              color="warning"
              disabled={reportSubmitting || !reportMessage.trim()}
            >
              {reportSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};
