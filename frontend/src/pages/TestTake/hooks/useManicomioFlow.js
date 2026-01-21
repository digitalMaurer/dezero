import { useState, useCallback } from 'react';
import { testsService } from '../../../services/apiServices';

export const useManicomioFlow = ({
  attemptId,
  currentQuestion,
  currentRespuesta,
  setRespuestas,
  setTestData,
  setCurrentQuestionIndex,
  navigate,
  manicomioLogic,
}) => {
  const [pendingManicomioResult, setPendingManicomioResult] = useState(null);
  const [manicomioCorrectas, setManicomioCorrectas] = useState(0);

  const handleManicomioAnswerClick = useCallback(async () => {
    if (!currentQuestion?.id) return;

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
      question: result.preguntaActual || currentQuestion,
      respuestaUsuario: currentRespuesta,
    });
  }, [
    attemptId,
    currentQuestion,
    currentRespuesta,
    manicomioLogic,
    navigate,
    setCurrentQuestionIndex,
    setRespuestas,
    setTestData,
  ]);

  const handleManicomioContinue = useCallback(() => {
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
      if (previousPreguntaId) {
        delete updated[previousPreguntaId];
        console.debug('[MANICOMIO] Limpiada respuesta de pregunta:', previousPreguntaId);
      }
      return updated;
    });

    setCurrentQuestionIndex((prev) => {
      const newIndex = prev + 1;
      console.debug('[MANICOMIO] Índice avanzado de', prev, 'a', newIndex);
      return newIndex;
    });

    console.debug('[MANICOMIO] ===== handleManicomioContinue FIN =====');
  }, [
    currentQuestion?.id,
    pendingManicomioResult,
    setCurrentQuestionIndex,
    setRespuestas,
    setTestData,
  ]);

  return {
    pendingManicomioResult,
    setPendingManicomioResult,
    manicomioCorrectas,
    handleManicomioAnswerClick,
    handleManicomioContinue,
  };
};
