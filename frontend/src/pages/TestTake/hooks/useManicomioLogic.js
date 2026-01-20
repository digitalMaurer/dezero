import { useState, useCallback } from 'react';
import { testsService } from '../../../services/apiServices';

export const useManicomioLogic = (attemptId, testData, respuestas, currentQuestionIndex) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [streakCurrent, setStreakCurrent] = useState(testData?.streakCurrent || 0);
  const [streakMax, setStreakMax] = useState(testData?.streakMax || 0);

  // Evitar leer propiedades si testData aún es null
  const mode = testData?.mode || 'ALEATORIO';

  const handleManicomioAnswer = useCallback(
    async (preguntaId, respuestaUsuario, setTestData, setCurrentQuestionIndex, setRespuestas) => {
      if (!preguntaId || !respuestaUsuario) {
        setError('Debes seleccionar una opción');
        return false;
      }

      console.debug('[MANICOMIO] payload', { preguntaId, respuestaUsuario });

      setError(null);
      setLoading(true);

      try {
        const response = await testsService.answerQuestion(attemptId, {
          preguntaId,
          respuestaUsuario,
        });

        // Back devuelve { success, data: { ... } }
        const dataWrapper = response?.data ?? response;
        const data = dataWrapper?.data ?? dataWrapper;
        setStreakCurrent(data.streakCurrent || 0);
        setStreakMax(data.streakMax || 0);
        setFeedback({
          esCorrecta: data.esCorrecta,
          remaining: data.remaining,
        });

        if (data.finished) {
          return { finished: true, puntaje: data.puntaje };
        }

        // En MANICOMIO, cargar siguiente pregunta dinámicamente
        if (mode === 'MANICOMIO') {
          try {
            const nextQuestion = await testsService.getNextManicomioQuestion(attemptId);
            const nextQuestionData = nextQuestion.data || nextQuestion;

            // Actualizar state correctamente
            setTestData((prev) => {
              if (!prev) return prev;
              const newPreguntas = [...(prev.preguntas || []), nextQuestionData];
              return { ...prev, preguntas: newPreguntas };
            });

            // Esperar a que se actualice testData antes de cambiar índice
            setCurrentQuestionIndex((prev) => prev + 1);
            setRespuestas((prev) => ({ ...prev, [nextQuestionData.id]: '' }));
          } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar la siguiente pregunta');
            console.error(err);
            return false;
          }
        }

        setFeedback(null);
        return true;
      } catch (err) {
        setError(err.response?.data?.message || 'Error al enviar la respuesta');
        console.error(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [attemptId, mode]
  );

  return {
    loading,
    error,
    setError,
    feedback,
    setFeedback,
    streakCurrent,
    setStreakCurrent,
    streakMax,
    setStreakMax,
    handleManicomioAnswer,
  };
};
