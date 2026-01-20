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
} from '@mui/material';
import { useTestData } from './hooks/useTestData';
import { useManicomioLogic } from './hooks/useManicomioLogic';
import { QuestionDisplay } from './components/QuestionDisplay';
import { ManicomioFeedback } from './components/ManicomioFeedback';
// Importar otros componentes cuando se crean

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
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Hook específico para MANICOMIO
  const manicomioLogic = useManicomioLogic(
    attemptId,
    testData,
    respuestas,
    currentQuestionIndex
  );

  // Timer para elapsed time
  useEffect(() => {
    if (isPaused || !testData?.tiempoInicio) return;
    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isPaused, testData]);

  // Guardar respuestas en localStorage
  useEffect(() => {
    if (!attemptId) return;
    localStorage.setItem(`test_answers_${attemptId}`, JSON.stringify(respuestas));
  }, [attemptId, respuestas]);

  const isManicomio = testData?.mode === 'MANICOMIO';
  const currentQuestion = testData?.preguntas?.[currentQuestionIndex];
  const currentRespuesta = respuestas[currentQuestion?.id] || '';

  const handleAnswerChange = (newRespuesta) => {
    setRespuestas((prev) => ({
      ...prev,
      [currentQuestion.id]: newRespuesta,
    }));
  };

  const handleManicomioAnswerClick = async () => {
    const result = await manicomioLogic.handleManicomioAnswer(
      currentQuestion.id,
      currentRespuesta,
      setTestData,
      setCurrentQuestionIndex,
      setRespuestas
    );

    if (result?.finished) {
      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);
      navigate(`/test/results/${attemptId}`);
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
        <Grid container spacing={3}>
          {/* Columna principal con la pregunta */}
          <Grid item xs={12} md={isManicomio ? 12 : 8}>
            <Box sx={{ mb: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {manicomioLogic.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {manicomioLogic.error}
                </Alert>
              )}
            </Box>

            {/* Mostrar la pregunta */}
            <QuestionDisplay
              question={currentQuestion}
              respuesta={currentRespuesta}
              onRespuestaChange={handleAnswerChange}
              disabled={manicomioLogic.loading}
            />

            {/* Feedback de MANICOMIO */}
            {isManicomio && (
              <ManicomioFeedback
                feedback={manicomioLogic.feedback}
                streakCurrent={manicomioLogic.streakCurrent}
                streakMax={manicomioLogic.streakMax}
                streakTarget={testData.streakTarget}
              />
            )}

            {/* Botón de respuesta para MANICOMIO */}
            {isManicomio && (
              <Box sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleManicomioAnswerClick}
                  disabled={manicomioLogic.loading || !currentRespuesta}
                >
                  {manicomioLogic.loading ? 'Procesando...' : 'Responder ✓'}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Otros componentes/modals irán aquí cuando se refactoricen */}
      </Box>
    </Container>
  );
};
