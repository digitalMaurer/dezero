import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FlagIcon from '@mui/icons-material/Flag';
import { preguntasService, testsService } from '../services/apiServices';

const TestTake = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [streakMax, setStreakMax] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const cached = localStorage.getItem(`test_${attemptId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setTestData(parsed);
        setStreakCurrent(parsed.streakCurrent || 0);
        setStreakMax(parsed.streakMax || 0);
        const savedAnswers = localStorage.getItem(`test_answers_${attemptId}`);
        if (savedAnswers) {
          setRespuestas(JSON.parse(savedAnswers));
        }
        setLoading(false);
        return;
      }

      const response = await testsService.getAttempt(attemptId);
      const attempt = response.data?.attempt || response.attempt || response;

      if (!attempt || !attempt.test?.questions) {
        throw new Error('Intento inválido');
      }

      const preguntas = attempt.test.questions
        .sort((a, b) => a.orden - b.orden)
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
        mode: attempt.mode || 'ALEATORIO',
        streakCurrent: attempt.streakCurrent || 0,
        streakMax: attempt.streakMax || 0,
      };

      setTestData(normalized);
      setStreakCurrent(normalized.streakCurrent);
      setStreakMax(normalized.streakMax);

      if (attempt.respuestas?.length) {
        const restored = attempt.respuestas.reduce((acc, r) => {
          acc[r.preguntaId] = r.respuestaUsuario || '';
          return acc;
        }, {});
        setRespuestas(restored);
      }

      const savedAnswers = localStorage.getItem(`test_answers_${attemptId}`);
      if (savedAnswers) {
        setRespuestas(JSON.parse(savedAnswers));
      }

      localStorage.setItem(`test_${attemptId}`, JSON.stringify(normalized));

      if (attempt.tiempoInicio) {
        const diffSeconds = Math.floor(
          (Date.now() - new Date(attempt.tiempoInicio).getTime()) / 1000
        );
        setElapsedTime(Math.max(diffSeconds, 0));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el test');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, [attemptId]);

  useEffect(() => {
    if (isPaused) return undefined;
    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isPaused]);

  useEffect(() => {
    if (!attemptId) return;
    localStorage.setItem(`test_answers_${attemptId}`, JSON.stringify(respuestas));
  }, [attemptId, respuestas]);

  const handleAnswerChange = (preguntaId, respuesta) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: respuesta }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < testData.preguntas.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleGoToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleFinishClick = () => {
    setOpenReviewDialog(true);
  };

  const handleGiveUp = async () => {
    const confirmed = window.confirm('¿Seguro que quieres rendirte y finalizar este intento?');
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      // Para Manicomio, simplemente marcar como finalizado sin enviar respuestas
      if (isManicomio) {
        navigate(`/test/results/${attemptId}`);
        localStorage.removeItem(`test_${attemptId}`);
        localStorage.removeItem(`test_answers_${attemptId}`);
      } else {
        const respuestasArray = testData.preguntas.map((pregunta) => ({
          preguntaId: pregunta.id,
          respuestaUsuario: respuestas[pregunta.id] || '',
        }));

        const response = await testsService.submitAttempt(attemptId, respuestasArray);

        localStorage.removeItem(`test_${attemptId}`);
        localStorage.removeItem(`test_answers_${attemptId}`);

        navigate(`/test/results/${attemptId}`, {
          state: { results: response.data || response },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al finalizar el test');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportClick = (question) => {
    setReportingQuestion(question);
    setOpenReportDialog(true);
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim() || !reportingQuestion) {
      alert('Por favor describe el problema con la pregunta');
      return;
    }

    setReportSubmitting(true);

    try {
      await preguntasService.reportQuestion(reportingQuestion.id, {
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

  const handleSubmit = async () => {
    setOpenReviewDialog(false);
    setSubmitting(true);
    setError(null);

    try {
      const respuestasArray = testData.preguntas.map((pregunta) => ({
        preguntaId: pregunta.id,
        respuestaUsuario: respuestas[pregunta.id] || '',
      }));

      const response = await testsService.submitAttempt(attemptId, respuestasArray);

      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);

      navigate(`/test/results/${attemptId}`, {
        state: { results: response.data || response },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el test');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManicomioAnswer = async () => {
    const currentQuestion = testData.preguntas[currentQuestionIndex];
    if (!respuestas[currentQuestion.id]) {
      setError('Debes seleccionar una opción');
      return;
    }

    setError(null);

    try {
      const response = await testsService.answerQuestion(attemptId, {
        preguntaId: currentQuestion.id,
        respuestaUsuario: respuestas[currentQuestion.id],
      });

      const data = response.data || response;
      setStreakCurrent(data.streakCurrent || 0);
      setStreakMax(data.streakMax || 0);
      setFeedback({
        esCorrecta: data.esCorrecta,
        remaining: data.remaining,
      });

      if (data.finished) {
        localStorage.removeItem(`test_${attemptId}`);
        localStorage.removeItem(`test_answers_${attemptId}`);
        navigate(`/test/results/${attemptId}`);
        return;
      }

      // Buscar la próxima pregunta sin responder
      const nextUnansweredIndex = testData.preguntas.findIndex(
        (q, idx) => idx > currentQuestionIndex && !respuestas[q.id]
      );

      if (nextUnansweredIndex !== -1) {
        setCurrentQuestionIndex(nextUnansweredIndex);
      }
      setFeedback(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la respuesta');
      console.error(err);
    }
  };

  const handleDeleteTestAttempt = async () => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este test en curso? No se podrá recuperar.');
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await testsService.deleteAttempt(attemptId);
      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);
      setOpenDeleteDialog(false);
      navigate('/estadisticas');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el test');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isManicomio = testData?.mode === 'MANICOMIO';
  const currentQuestion = testData?.preguntas?.[currentQuestionIndex];

  // Función para mezclar opciones de manera determinista (misma pregunta siempre igual)
  const getShuffledOptions = (question) => {
    if (!question) return [];
    
    const options = [
      { label: 'A', text: question.opcionA, original: 'A' },
      { label: 'B', text: question.opcionB, original: 'B' },
      { label: 'C', text: question.opcionC, original: 'C' },
    ];
    
    if (question.opcionD) {
      options.push({ label: 'D', text: question.opcionD, original: 'D' });
    }

    // Usar el ID de la pregunta como seed para mantener consistencia
    // Mezcla de Fisher-Yates con seed basado en preguntaId
    const seed = question.id.charCodeAt(0) + question.id.charCodeAt(question.id.length - 1);
    let shuffled = [...options];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };

  const shuffledOptions = useMemo(() => {
    return getShuffledOptions(currentQuestion);
  }, [currentQuestion?.id]);

  const progress = useMemo(() => {
    if (!testData?.preguntas?.length) return 0;
    return ((currentQuestionIndex + 1) / testData.preguntas.length) * 100;
  }, [currentQuestionIndex, testData]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!testData || !testData.preguntas || testData.preguntas.length === 0 || !currentQuestion) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          No se pudo cargar el test
        </Alert>
      </Container>
    );
  }

  const respondidas = Object.keys(respuestas).length;
  const noRespondidas = testData.preguntas.length - respondidas;
  const tiempoEstimado = testData.preguntas.length * 120;
  const tiempoRestante = tiempoEstimado - elapsedTime;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              ✍️ Test en Progreso
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pregunta {currentQuestionIndex + 1} de {testData.preguntas.length}
            </Typography>
            {isManicomio && (
              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                MODO MANICOMIO · Necesitas 30 aciertos seguidos sin dejar en blanco.
              </Typography>
            )}
          </Box>

          <Tooltip title="Eliminar este test en curso">
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setOpenDeleteDialog(true)}
              sx={{ mt: 1 }}
            >
              🗑️ Eliminar Test
            </Button>
          </Tooltip>

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
              <Typography variant="caption">{isPaused ? 'PAUSADO' : 'En ejecución'}</Typography>
            </Paper>

            <Tooltip title={isPaused ? 'Reanudar' : 'Pausar'}>
              <IconButton
                onClick={() => setIsPaused(!isPaused)}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
              >
                {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
              </IconButton>
            </Tooltip>

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
          <Grid item xs={12} md={isManicomio ? 12 : 8}>
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
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                >
                  {shuffledOptions.map((option) => (
                    <FormControlLabel
                      key={option.original}
                      value={option.original}
                      control={<Radio />}
                      label={`${option.label}) ${option.text}`}
                      sx={{ mb: 2 }}
                    />
                  ))}
                  {!isManicomio && (
                    <FormControlLabel
                      value=""
                      control={<Radio />}
                      label="Dejar en blanco"
                      sx={{ mb: 2, fontStyle: 'italic', opacity: 0.7 }}
                    />
                  )}
                </RadioGroup>
              </FormControl>

              {isManicomio && feedback && (
                <Alert severity={feedback.esCorrecta ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {feedback.esCorrecta ? '✅ Respuesta correcta' : '❌ Respuesta incorrecta, la racha se reinicia'}
                  {typeof feedback.remaining === 'number' && <strong> · Te faltan {feedback.remaining} aciertos para llegar a 30.</strong>}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!isManicomio && (
                    <Button variant="outlined" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                      ⬅️ Anterior
                    </Button>
                  )}

                  {isManicomio ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleManicomioAnswer}
                      disabled={!respuestas[currentQuestion.id] || submitting}
                    >
                      Enviar respuesta ➡️
                    </Button>
                  ) : currentQuestionIndex === testData.preguntas.length - 1 ? (
                    <Button variant="contained" color="success" onClick={handleFinishClick} disabled={submitting} size="large">
                      ✅ Finalizar Test
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleNext}>
                      Siguiente ➡️
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {isManicomio && (
                    <Button variant="outlined" color="error" onClick={handleGiveUp} disabled={submitting}>
                      Rendirse
                    </Button>
                  )}
                  <Tooltip title="Reportar problema con esta pregunta">
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<FlagIcon />}
                      onClick={() => handleReportClick(currentQuestion)}
                      size="small"
                    >
                      Reportar
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {!isManicomio && (
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    📊 Resumen
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Respondidas:</Typography>
                      <Chip label={respondidas} color="success" size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Sin responder:</Typography>
                      <Chip label={noRespondidas} color="warning" size="small" variant="outlined" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    🗺️ Mapa de Preguntas (por dificultad)
                  </Typography>
                  <Grid container spacing={1}>
                    {testData.preguntas.map((pregunta, index) => {
                      const isAnswered = Object.prototype.hasOwnProperty.call(respuestas, pregunta.id);
                      const isCurrent = index === currentQuestionIndex;

                      return (
                        <Grid item xs={3} key={pregunta.id}>
                          <Tooltip title={`${pregunta.dificultad} - ${isAnswered ? 'Respondida' : 'Sin responder'}`}>
                            <Button
                              fullWidth
                              variant={isCurrent ? 'contained' : 'outlined'}
                              color={
                                isCurrent
                                  ? 'primary'
                                  : pregunta.dificultad === 'EASY'
                                  ? 'success'
                                  : pregunta.dificultad === 'MEDIUM'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="small"
                              onClick={() => handleGoToQuestion(index)}
                              sx={{ minHeight: '45px', fontSize: '0.75rem', fontWeight: isCurrent || isAnswered ? 'bold' : 'normal' }}
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
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                    ✓ = Respondida | — = Sin responder
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {isManicomio && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    🔥 Racha actual
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip label={`Actual: ${streakCurrent}`} color="primary" />
                    <Chip label={`Máxima: ${streakMax}`} color="secondary" />
                    <Chip label={`Faltan: ${Math.max(30 - streakCurrent, 0)}`} color="success" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {!isManicomio && (
          <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
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
                      ⚠️ Tienes {noRespondidas} pregunta(s) sin responder. Serán contadas como incorrectas.
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
              <Button onClick={handleSubmit} variant="contained" color="success" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Confirmar y Finalizar'}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>🚩 Reportar Pregunta</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Cuéntanos qué problema tiene esta pregunta. Puede ser un error en el enunciado, respuesta incorrecta, ambigüedad, etc.
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
                setReportingQuestion(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitReport} variant="contained" color="warning" disabled={reportSubmitting || !reportMessage.trim()}>
              {reportSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo eliminar test */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>🗑️ Eliminar Test en Curso</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mt: 2 }}>
              ¿Seguro que quieres eliminar este test? No se podrá recuperar.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button color="error" onClick={handleDeleteTestAttempt} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TestTake;
export { TestTake };
