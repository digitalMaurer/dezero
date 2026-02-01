import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestTimer } from './hooks/useTestTimer';
import { testsService } from '../../services/apiServices';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Alert,
  Paper,
  Typography,
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
import { useUIStore } from '../../store/uiStore';
import { safeSetItem } from '../../utils/localStorageManager';

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
  const { focusMode } = useUIStore();

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
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'single'
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showTema, setShowTema] = useState(true);

  // Hook específico para MANICOMIO
  const manicomioLogic = useManicomioLogic(
    attemptId,
    testData,
    respuestas,
    currentQuestionIndex
  );

  // Derivados usados por varios hooks
  const isManicomio = testData?.mode === 'MANICOMIO';
  const isAnkiMode = testData?.mode === 'ANKI';
  const isSequential = isManicomio || isAnkiMode;
  const currentQuestion = testData?.preguntas?.[currentQuestionIndex];
  const currentRespuesta = currentQuestion ? respuestas[currentQuestion.id] || '' : '';
  const effectiveViewMode = isSequential ? 'single' : viewMode;

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
    currentQuestionIndex,
    testData,
    isAnkiMode,
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
    difficultyDraft,
    setDifficultyDraft,
    savingDifficulty,
    difficultyError,
    handleReportClick,
    handleSubmitReport,
    handleToggleFavorite,
    handleSaveTip,
    handleManicomioAnkiGrade,
    handleSaveDifficulty,
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
    safeSetItem(`test_answers_${attemptId}`, JSON.stringify(respuestas));
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

  const toggleViewMode = () => {
    if (isSequential) return; // Vista fija en flujos secuenciales
    setViewMode(prev => prev === 'list' ? 'single' : 'list');
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      
      if (!attemptId) {
        setError('No se puede exportar: intento no cargado.');
        setExportingPDF(false);
        return;
      }
      
      const response = await testsService.exportAttemptToPDF(attemptId, true);
      
      // Crear blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-${attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      setError('No se pudo exportar el PDF. Intenta de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    if (isSequential && viewMode !== 'single') {
      setViewMode('single');
    }
  }, [isSequential, viewMode]);

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
          viewMode={effectiveViewMode}
          onToggleViewMode={toggleViewMode}
        />

        <TestActionsBar
          onSurrender={() => setOpenSurrenderDialog(true)}
          onDelete={() => setOpenDeleteDialog(true)}
          onExportPDF={handleExportPDF}
          onToggleTema={() => setShowTema((prev) => !prev)}
          showTema={showTema}
          surrendering={surrendering}
          deleting={deleting}
          exportingPDF={exportingPDF}
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

        {/* Wrapper para modo concentración */}
        <Box
          sx={{
            position: 'relative',
            ...(focusMode && {
              '&::before': {
                content: '""',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 1,
                pointerEvents: 'none',
              },
            }),
          }}
        >
          <Grid 
            container 
            spacing={3}
            sx={{
              ...(focusMode && {
                position: 'relative',
                zIndex: 2,
              }),
            }}
          >
          {/* VISTA INDIVIDUAL (MANICOMIO o modo single) */}
          {(isSequential || effectiveViewMode === 'single') && (
            <>
              {/* Columna principal con la pregunta - FULLWIDTH */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 4 }}>
                  {/* Mostrar la pregunta */}
                  <QuestionDisplay
                    question={currentQuestion}
                    respuesta={currentRespuesta}
                    onRespuestaChange={handleAnswerChange}
                    disabled={manicomioLogic.loading || (isSequential && pendingManicomioResult)}
                    showTema={showTema}
                  />

                  {/* Feedback: Ya respondiste esta pregunta (MANICOMIO) */}
                  {isSequential && pendingManicomioResult && (
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
                    viewMode={effectiveViewMode}
                    sequentialMode={isSequential}
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
              {/* NO hay sidebar en vista individual */}
            </>
          )}

          {/* VISTA DE LISTA (solo NO-MANICOMIO) */}
          {!isSequential && effectiveViewMode === 'list' && (
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {testData.preguntas.map((pregunta, index) => (
                  <Paper 
                    key={pregunta.id} 
                    id={`question-${index}`}
                    elevation={3} 
                    sx={{ p: 4 }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      Pregunta {index + 1} de {testData.preguntas.length}
                    </Typography>
                    
                    <QuestionDisplay
                      question={pregunta}
                      respuesta={respuestas[pregunta.id] || ''}
                      onRespuestaChange={(value) => {
                        setRespuestas((prev) => ({ ...prev, [pregunta.id]: value }));
                        safeSetItem(`attempt_${attemptId}_respuestas`, JSON.stringify({ ...respuestas, [pregunta.id]: value }));
                      }}
                      disabled={false}
                      showTema={showTema}
                    />

                    <QuestionActions
                      currentQuestion={pregunta}
                      isFavorite={favorites[pregunta.id]}
                      onReport={() => {
                        setReportingQuestion(pregunta);
                        setOpenReportDialog(true);
                      }}
                      onToggleFavorite={() => handleToggleFavorite(pregunta.id)}
                    />
                  </Paper>
                ))}
              </Box>

              {/* Botón finalizar al final de la lista */}
              <Paper elevation={3} sx={{ p: 4, mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleFinishClick}
                  disabled={submitting}
                >
                  🏁 Finalizar Test
                </Button>
              </Paper>
            </Grid>
          )}

          {/* Sidebar siempre visible en vista lista */}
          {!isSequential && effectiveViewMode === 'list' && (
            <Grid item xs={12} md={4}>
              <QuestionMap
                preguntas={testData.preguntas}
                respuestas={respuestas}
                currentQuestionIndex={currentQuestionIndex}
                onGoToQuestion={(index) => {
                  setCurrentQuestionIndex(index);
                  // Scroll a la pregunta
                  const element = document.getElementById(`question-${index}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            </Grid>
          )}
          </Grid>
        </Box>

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
            isAnkiMode,
            favorites,
            tipDraft,
            tipError,
            savingTip,
            ankiSaving,
            ankiGrade,
            ankiError,
            difficultyDraft,
            difficultyError,
            savingDifficulty,
            onClose: () => setPendingManicomioResult(null),
            onReport: handleReportClick,
            onToggleFavorite: handleToggleFavorite,
            onSaveTip: handleSaveTip,
            onTipChange: setTipDraft,
            onAnkiGrade: handleManicomioAnkiGrade,
            onDifficultyChange: setDifficultyDraft,
            onSaveDifficulty: handleSaveDifficulty,
            onContinue: handleManicomioContinue,
          }}
        />
      </Box>
    </Container>
  );
};

export default TestTake;
