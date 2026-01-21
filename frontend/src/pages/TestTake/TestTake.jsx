import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestTimer } from './hooks/useTestTimer';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Alert,
  Paper,
} from '@mui/material';
import { useTestData } from './hooks/useTestData';
import { useManicomioLogic } from './hooks/useManicomioLogic';
import { useManicomioFlow } from './hooks/useManicomioFlow';
import { useAttemptActions } from './hooks/useAttemptActions';
import { useQuestionMeta } from './hooks/useQuestionMeta';
import { QuestionDisplay } from './components/QuestionDisplay';
import { ManicomioFeedback } from './components/ManicomioFeedback';
import { TestHeader } from './components/TestHeader';
import { QuestionControls } from './components/QuestionControls';
import { QuestionMap } from './components/QuestionMap';
import { QuestionActions } from './components/QuestionActions';
import { TestTakeDialogs } from './components/TestTakeDialogs';
import { TestActionsBar } from './components/TestActionsBar';

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
  const [error, setError] = useState(null);

  // Hook específico para MANICOMIO
  const manicomioLogic = useManicomioLogic(
    attemptId,
    testData,
    respuestas,
    currentQuestionIndex
  );

  // Derivados usados por varios hooks
  const isManicomio = testData?.mode === 'MANICOMIO';
  const currentQuestion = testData?.preguntas?.[currentQuestionIndex];
  const currentRespuesta = currentQuestion ? respuestas[currentQuestion.id] || '' : '';

  // Timer y estimaciones
  const {
    elapsedTime,
    isPaused,
    togglePause,
    tiempoEstimado,
    tiempoRestante,
  } = useTestTimer({
    tiempoInicio: testData?.tiempoInicio,
    questionCount: testData?.preguntas?.length || 0,
  });

  const {
    openReviewDialog,
    setOpenReviewDialog,
    openDeleteDialog,
    setOpenDeleteDialog,
    openSurrenderDialog,
    setOpenSurrenderDialog,
    deleting,
    surrendering,
    submitting,
    error: attemptError,
    setError: setAttemptError,
    handleFinishClick,
    handleSubmit,
    handleDeleteTestAttempt,
    handleSurrenderAttempt,
  } = useAttemptActions({
    attemptId,
    testData,
    respuestas,
    navigate,
  });

  const {
    pendingManicomioResult,
    setPendingManicomioResult,
    manicomioCorrectas,
    handleManicomioAnswerClick,
    handleManicomioContinue,
  } = useManicomioFlow({
    attemptId,
    currentQuestion,
    currentRespuesta,
    setRespuestas,
    setTestData,
    setCurrentQuestionIndex,
    navigate,
    manicomioLogic,
  });

  const {
    openReportDialog,
    setOpenReportDialog,
    reportingQuestion,
    setReportingQuestion,
    reportSubmitting,
    favorites,
    tipDraft,
    setTipDraft,
    tipError,
    savingTip,
    ankiSaving,
    ankiGrade,
    ankiError,
    handleReportClick,
    handleSubmitReport,
    handleToggleFavorite,
    handleSaveTip,
    handleManicomioAnkiGrade,
  } = useQuestionMeta({
    attemptId,
    pendingManicomioResult,
    setPendingManicomioResult,
    setTestData,
  });

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

  useEffect(() => {
    if (attemptError) {
      setError(attemptError);
      setAttemptError(null);
    }
  }, [attemptError, setAttemptError]);


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
          onTogglePause={togglePause}
          progress={progress}
        />

        <TestActionsBar
          onSurrender={() => setOpenSurrenderDialog(true)}
          onDelete={() => setOpenDeleteDialog(true)}
          surrendering={surrendering}
          deleting={deleting}
        />

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

        <TestTakeDialogs
          review={{
            open: openReviewDialog,
            onClose: () => setOpenReviewDialog(false),
            onConfirm: handleSubmit,
            respondidas: Object.keys(respuestas).length,
            totalPreguntas: testData.preguntas.length,
            elapsedTime,
            submitting,
          }}
          report={{
            open: openReportDialog,
            onClose: () => {
              setOpenReportDialog(false);
              setReportingQuestion(null);
            },
            onSubmit: handleSubmitReport,
            reportingQuestion,
            submitting: reportSubmitting,
          }}
          surrender={{
            open: openSurrenderDialog,
            onClose: () => setOpenSurrenderDialog(false),
            onConfirm: handleSurrenderAttempt,
            loading: surrendering,
          }}
          deletion={{
            open: openDeleteDialog,
            onClose: () => setOpenDeleteDialog(false),
            onConfirm: handleDeleteTestAttempt,
            loading: deleting,
          }}
          manicomio={{
            open: !!pendingManicomioResult,
            result: pendingManicomioResult,
            streakTarget: testData.streakTarget,
            favorites,
            tipDraft,
            tipError,
            savingTip,
            ankiSaving,
            ankiGrade,
            ankiError,
            onClose: () => setPendingManicomioResult(null),
            onReport: handleReportClick,
            onToggleFavorite: handleToggleFavorite,
            onSaveTip: handleSaveTip,
            onTipChange: setTipDraft,
            onAnkiGrade: handleManicomioAnkiGrade,
            onContinue: handleManicomioContinue,
          }}
        />
      </Box>
    </Container>
  );
};

export default TestTake;
