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
    async (preguntaId, respuestaUsuario) => {
      if (!preguntaId || !respuestaUsuario) {
        setError('Debes seleccionar una opción');
        return false;
      }

      // Validar que no sea "__none" (en blanco)
      if (respuestaUsuario === '__none') {
        setError('Debes seleccionar una opción de respuesta');
        return false;
      }

      console.debug('[MANICOMIO] Respondiendo pregunta', { preguntaId, respuestaUsuario });

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
        
        console.debug('[MANICOMIO] Respuesta recibida:', data);
        
        setStreakCurrent(data.streakCurrent || 0);
        setStreakMax(data.streakMax || 0);
        setFeedback({
          esCorrecta: data.esCorrecta,
          remaining: data.remaining,
          message: data.esCorrecta 
            ? '✅ ¡Respuesta correcta!' 
            : '❌ Respuesta incorrecta, la racha se reinicia',
        });

        if (data.finished) {
          console.debug('[MANICOMIO] Test finalizado');
          return { finished: true, puntaje: data.puntaje };
        }

        // En MANICOMIO, cargar siguiente pregunta pero devolverla al caller para decidir cuándo avanzar
        if (mode === 'MANICOMIO') {
          try {
            const nextQuestion = await testsService.getNextManicomioQuestion(attemptId);
            const nextQuestionData = nextQuestion.data || nextQuestion;
            
            console.debug('[MANICOMIO] Siguiente pregunta cargada:', nextQuestionData);
            
            return {
              finished: false,
              answered: true,
              nextQuestion: nextQuestionData,
              esCorrecta: data.esCorrecta,
              respuestaCorrecta: data.respuestaCorrecta,
              textoRespuestaUsuario: data.textoRespuestaUsuario,
              textoRespuestaCorrecta: data.textoRespuestaCorrecta,
              preguntaActual: data.preguntaActual,
              remaining: data.remaining,
              message: data.esCorrecta 
                ? '✅ ¡Respuesta correcta!' 
                : '❌ Respuesta incorrecta, la racha se reinicia',
            };
          } catch (err) {
            const errMsg = err.response?.data?.message || 'Error al cargar la siguiente pregunta';
            setError(errMsg);
            console.error(err);
            return false;
          }
        }

        return {
          finished: false,
          answered: true,
          esCorrecta: data.esCorrecta,
          respuestaCorrecta: data.respuestaCorrecta,
          textoRespuestaUsuario: data.textoRespuestaUsuario,
          textoRespuestaCorrecta: data.textoRespuestaCorrecta,
          preguntaActual: data.preguntaActual,
          remaining: data.remaining,
          message: data.esCorrecta 
            ? '✅ ¡Respuesta correcta!'
            : '❌ Respuesta incorrecta',
        };
      } catch (err) {
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error al enviar la respuesta';
        setError(errMsg);
        console.error('[MANICOMIO] Error detallado:', {
          status: err.response?.status,
          message: errMsg,
          data: err.response?.data,
          fullError: err,
        });
        
        // Si la pregunta ya fue respondida, permitir recuperación
        if (errMsg.includes('ya fue respondida')) {
          console.warn('[MANICOMIO] Pregunta bloqueada detectada, activando recuperación');
          return {
            blocked: true,
            finished: false,
            answered: false,
            message: 'Esta pregunta ya está registrada. Cargando siguiente pregunta...'
          };
        }
        
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
