import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Alert,
  Paper,
  Typography,
  Tooltip,
} from '@mui/material';
import { useTestData } from './hooks/useTestData';
import { useManicomioLogic } from './hooks/useManicomioLogic';
import { QuestionDisplay } from './components/QuestionDisplay';
import { ManicomioFeedback } from './components/ManicomioFeedback';
import { TestHeader } from './components/TestHeader';
import { QuestionControls } from './components/QuestionControls';
import { QuestionMap } from './components/QuestionMap';
import { ReviewDialog } from './components/ReviewDialog';
import { QuestionActions, ReportDialog } from './components/QuestionActions';
import { preguntasService, testsService, favoritesService } from '../../services/apiServices';

/**
 * MEJORAS FUTURAS:
 * 1. Extraer MANICOMIO modal workflow a componente separado <ManicomioModal />
 * 2. Crear hook useAnswerValidation() para centralizar lógica de validación
 * 3. Optimizar re-renders con useMemo/useCallback (actualmente re-renderiza demasiado)
 * 4. Implementar virtualización para QuestionMap si hay muchas preguntas
 * 5. Agregar contador tiempo real sincronizado con backend
 * 6. Implementar auto-save cada N segundos en localStorage
 * 7. Agregar keyboard shortcuts (Enter para responder, Flechas para navegar)
 * 8. Mejorar UX de recuperación de pregunta bloqueada (más silencioso, sin alert)
 * 9. Agregar análisis en tiempo real (% acierto, velocidad respuesta)
 * 10. Precargar siguiente pregunta mientras usuario responde actual
 * 11. Implementar lazy loading de imágenes si hay en preguntas
 * 12. Agregar modo oscuro/light toggle
 * 13. Tests E2E para flujo completo MANICOMIO
 * 14. Mejorar manejo de errores con retry automático
 * 15. Agregar logging de eventos para analytics
 */

export const TestTake = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Hooks personalizados para la lógica
  const {
    testData,
    setTestData,
    respuestas,
    setRespuestas,
    loading,
    error: loadError,
    setError: setLoadError,
  } = useTestData(attemptId);

  // Estado local
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [pendingManicomioResult, setPendingManicomioResult] = useState(null);
  const [manicomioCorrectas, setManicomioCorrectas] = useState(0);

  // Hook específico para MANICOMIO
  const manicomioLogic = useManicomioLogic(
    attemptId,
    testData,
    respuestas,
    currentQuestionIndex
  );

  // Definir variables derivadas ANTES de los useEffects
  const isManicomio = testData?.mode === 'MANICOMIO';
  const currentQuestion = testData?.preguntas?.[currentQuestionIndex];
  const currentRespuesta = respuestas[currentQuestion?.id] || '';

  // Timer para elapsed time
  useEffect(() => {
    if (isPaused || !testData?.tiempoInicio) return;
    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isPaused, testData]);

  // Cuando el índice cambia (siguiente pregunta), resetear la respuesta actual
  useEffect(() => {
    if (isManicomio) {
      console.debug('[MANICOMIO] Índice cambió a:', currentQuestionIndex);
      console.debug('[MANICOMIO] Pregunta actual:', currentQuestion?.id);
    }
  }, [currentQuestionIndex, isManicomio, currentQuestion?.id]);

  // Guardar respuestas en localStorage
  useEffect(() => {
    if (!attemptId) return;
    localStorage.setItem(`test_answers_${attemptId}`, JSON.stringify(respuestas));
  }, [attemptId, respuestas]);

  const progress = useMemo(() => {
    if (!testData?.preguntas?.length) return 0;
    return ((currentQuestionIndex + 1) / testData.preguntas.length) * 100;
  }, [currentQuestionIndex, testData]);

  const tiempoEstimado = useMemo(() => {
    if (!testData?.preguntas?.length) return 0;
    return testData.preguntas.length * 120; // 2 min por pregunta
  }, [testData]);

  const tiempoRestante = tiempoEstimado - elapsedTime;

  const handleAnswerChange = (newRespuesta) => {
    if (newRespuesta === '__none') {
      setRespuestas((prev) => {
        const { [currentQuestion.id]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    setRespuestas((prev) => ({
      ...prev,
      [currentQuestion.id]: newRespuesta,
    }));
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

  const handleReportClick = (question) => {
    setReportingQuestion(question);
    setOpenReportDialog(true);
  };

  const handleSubmitReport = async (mensaje) => {
    if (!mensaje.trim() || !reportingQuestion) {
      return;
    }

    setReportSubmitting(true);

    try {
      await preguntasService.reportQuestion(reportingQuestion.id, {
        mensaje,
        attemptId,
      });

      setOpenReportDialog(false);
      setReportingQuestion(null);
      alert('✅ Pregunta reportada. Gracias por ayudarnos a mejorar.');
    } catch (err) {
      alert('Error al reportar la pregunta');
      console.error(err);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleToggleFavorite = async (preguntaId) => {
    try {
      const response = await favoritesService.toggle(preguntaId);
      const isFavorite = response.data?.isFavorite;
      setFavorites((prev) => ({ ...prev, [preguntaId]: isFavorite }));
    } catch (err) {
      console.error('Error al actualizar favorito:', err);
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

  const handleManicomioAnswerClick = async () => {
    console.debug('[MANICOMIO] currentQuestion', currentQuestion);
    console.debug('[MANICOMIO] currentRespuesta', currentRespuesta);
    const result = await manicomioLogic.handleManicomioAnswer(
      currentQuestion.id,
      currentRespuesta
    );

    if (!result) return;

    // Si la pregunta estaba bloqueada (ya respondida), auto-recuperar
    if (result.blocked) {
      console.warn('[MANICOMIO] Pregunta bloqueada, cargando siguiente automáticamente');
      alert('⚠️ Esta pregunta ya fue registrada. Cargando siguiente pregunta...');
      
      // Limpiar respuesta del estado
      setRespuestas((prev) => {
        const updated = { ...prev };
        delete updated[currentQuestion.id];
        return updated;
      });
      
      // Cargar siguiente pregunta directamente del backend
      try {
        const response = await testsService.getNextManicomioQuestion(attemptId);
        const nextQuestion = response.data;
        
        // Agregar la nueva pregunta al testData
        setTestData((prev) => ({
          ...prev,
          preguntas: [...(prev.preguntas || []), nextQuestion],
        }));
        
        // Avanzar al índice de la nueva pregunta
        setCurrentQuestionIndex((prev) => prev + 1);
        
        console.debug('[MANICOMIO] Nueva pregunta cargada después de bloqueo:', nextQuestion.id);
      } catch (err) {
        console.error('[MANICOMIO] Error al cargar siguiente pregunta:', err);
        alert('Error al cargar la siguiente pregunta. Por favor, recarga la página.');
      }
      
      return;
    }

    if (result.esCorrecta) {
      setManicomioCorrectas((prev) => prev + 1);
    }

    if (result.finished) {
      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);
      navigate(`/test/results/${attemptId}`);
      return;
    }

    setPendingManicomioResult({
      ...result,
      question: currentQuestion,
      respuesta: currentRespuesta,
    });
  };

  const handleManicomioContinue = () => {
    if (!pendingManicomioResult?.nextQuestion) {
      console.warn('[MANICOMIO] No hay siguiente pregunta disponible');
      setPendingManicomioResult(null);
      return;
    }

    const nextQuestionData = pendingManicomioResult.nextQuestion;
    const previousPreguntaId = currentQuestion?.id;
    
    console.debug('[MANICOMIO] ===== handleManicomioContinue INICIO =====');
    console.debug('[MANICOMIO] Pregunta anterior:', previousPreguntaId);
    console.debug('[MANICOMIO] Siguiente pregunta:', nextQuestionData.id);
    console.debug('[MANICOMIO] Respuestas ANTES de limpiar:', { ...respuestas });

    // 1. Cerrar modal
    setPendingManicomioResult(null);

    // 2. Actualizar testData agregando la nueva pregunta
    setTestData((prev) => {
      if (!prev) {
        console.warn('[MANICOMIO] testData es null');
        return prev;
      }
      const newPreguntas = [...(prev.preguntas || []), nextQuestionData];
      console.debug('[MANICOMIO] testData actualizado. Preguntas totales:', newPreguntas.length);
      return { ...prev, preguntas: newPreguntas };
    });

    // 3. Limpiar respuestas y avanzar índice
    setRespuestas((prev) => {
      const updated = { ...prev };
      // Limpiar la pregunta ANTERIOR para que no se re-envíe
      if (previousPreguntaId) {
        delete updated[previousPreguntaId];
        console.debug('[MANICOMIO] Limpiada respuesta de pregunta:', previousPreguntaId);
      }
      console.debug('[MANICOMIO] Respuestas DESPUÉS de limpiar:', { ...updated });
      return updated;
    });

    setCurrentQuestionIndex((prev) => {
      const newIndex = prev + 1;
      console.debug('[MANICOMIO] Índice avanzado de', prev, 'a', newIndex);
      return newIndex;
    });

    console.debug('[MANICOMIO] ===== handleManicomioContinue FIN =====');
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

  if (loadError) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{loadError}</Alert>
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

  if (!testData || !currentQuestion) {
    return (
      <Container>
        <Alert severity="error">No se pudo cargar la pregunta</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header con timer y progreso */}
        <TestHeader
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={testData.preguntas.length}
          isManicomio={isManicomio}
          streakTarget={testData.streakTarget}
          elapsedTime={elapsedTime}
          tiempoRestante={tiempoRestante}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          progress={progress}
        />

        {/* Botón eliminar test */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tooltip title="Eliminar este test en curso">
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setOpenDeleteDialog(true)}
            >
              🗑️ Eliminar Test
            </Button>
          </Tooltip>
        </Box>

        {/* Mensajes de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {manicomioLogic.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {manicomioLogic.error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Columna principal con la pregunta */}
          <Grid item xs={12} md={isManicomio ? 12 : 8}>
            <Paper elevation={3} sx={{ p: 4 }}>
              {/* Mostrar la pregunta */}
              <QuestionDisplay
                question={currentQuestion}
                respuesta={currentRespuesta}
                onRespuestaChange={handleAnswerChange}
                disabled={manicomioLogic.loading || (isManicomio && pendingManicomioResult)}
              />

              {/* Feedback: Ya respondiste esta pregunta (MANICOMIO) */}
              {isManicomio && pendingManicomioResult && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  ✅ Ya has respondido a esta pregunta. Revisa el resultado abajo y continúa cuando estés listo.
                </Alert>
              )}

              {/* Feedback de MANICOMIO */}
              {isManicomio && (
                <ManicomioFeedback
                  feedback={pendingManicomioResult || manicomioLogic.feedback}
                  streakCurrent={manicomioLogic.streakCurrent}
                  streakMax={manicomioLogic.streakMax}
                  streakTarget={testData.streakTarget}
                  correctasTotales={manicomioCorrectas}
                />
              )}

              {/* Controles de navegación */}
              <QuestionControls
                isManicomio={isManicomio}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={testData.preguntas.length}
                hasAnswer={!!currentRespuesta}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onFinish={handleFinishClick}
                onManicomioAnswer={handleManicomioAnswerClick}
                loading={manicomioLogic.loading}
              />

              {/* Acciones de pregunta (reportar, favorito) */}
              <QuestionActions
                currentQuestion={currentQuestion}
                isFavorite={favorites[currentQuestion?.id]}
                onReport={handleReportClick}
                onToggleFavorite={handleToggleFavorite}
              />
            </Paper>
          </Grid>

          {/* Sidebar con mapa de preguntas (solo en no-MANICOMIO) */}
          {!isManicomio && (
            <Grid item xs={12} md={4}>
              <QuestionMap
                preguntas={testData.preguntas}
                respuestas={respuestas}
                currentQuestionIndex={currentQuestionIndex}
                onGoToQuestion={handleGoToQuestion}
              />
            </Grid>
          )}
        </Grid>

        {/* Diálogo de revisión */}
        <ReviewDialog
          open={openReviewDialog}
          onClose={() => setOpenReviewDialog(false)}
          onConfirm={handleSubmit}
          respondidas={Object.keys(respuestas).length}
          totalPreguntas={testData.preguntas.length}
          elapsedTime={elapsedTime}
          submitting={submitting}
        />

        {/* Diálogo de reportar pregunta */}
        <ReportDialog
          open={openReportDialog}
          onClose={() => {
            setOpenReportDialog(false);
            setReportingQuestion(null);
          }}
          onSubmit={handleSubmitReport}
          reportingQuestion={reportingQuestion}
          submitting={reportSubmitting}
        />

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

        {/* Diálogo de feedback MANICOMIO (permite reportar antes de continuar) */}
        <Dialog
          open={!!pendingManicomioResult}
          onClose={() => setPendingManicomioResult(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Resultado</DialogTitle>
          <DialogContent>
            <Alert
              severity={pendingManicomioResult?.esCorrecta ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {pendingManicomioResult?.esCorrecta
                ? '✅ Respuesta correcta'
                : '❌ Respuesta incorrecta, la racha se reinicia'}
              {typeof pendingManicomioResult?.remaining === 'number' && (
                <strong>
                  {' '}
                  · Te faltan {pendingManicomioResult.remaining} aciertos para llegar a {testData.streakTarget}.
                </strong>
              )}
            </Alert>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Pregunta respondida:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pendingManicomioResult?.question?.enunciado}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                if (pendingManicomioResult?.question) {
                  handleReportClick(pendingManicomioResult.question);
                }
              }}
            >
              Reportar esta pregunta
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setPendingManicomioResult(null)}>Cerrar</Button>
              <Button variant="contained" onClick={handleManicomioContinue}>
                Continuar
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TestTake;
