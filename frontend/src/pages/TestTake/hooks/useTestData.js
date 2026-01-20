import { useState, useEffect } from 'react';
import { testsService } from '../../../services/apiServices';

export const useTestData = (attemptId) => {
  const [testData, setTestData] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPreguntaValid = (p) =>
    p && p.id && p.titulo && p.enunciado && p.opcionA && p.opcionB && p.opcionC && p.respuestaCorrecta;

  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);
      setError(null);

      try {
        // Intentar cargar del localStorage primero
        const cached = localStorage.getItem(`test_${attemptId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Asegurar que streakTarget exista
          if (!parsed.streakTarget) {
            parsed.streakTarget = 30;
          }

          // Validar cache; si está incompleta, ignorar y forzar fetch
          const cacheIsValid = Array.isArray(parsed.preguntas) && parsed.preguntas.every(isPreguntaValid);
          if (cacheIsValid) {
            setTestData(parsed);
            const savedAnswers = localStorage.getItem(`test_answers_${attemptId}`);
            if (savedAnswers) {
              setRespuestas(JSON.parse(savedAnswers));
            }
            setLoading(false);
            return;
          }
        }

        // Si no está en cache (o es inválido), cargar del servidor
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
            respuestaCorrecta: q.pregunta.respuestaCorrecta,
          }))
          .filter(isPreguntaValid);

        if (preguntas.length === 0) {
          throw new Error('No hay preguntas válidas en el intento');
        }

        const normalized = {
          attemptId: attempt.id,
          testId: attempt.testId,
          preguntas,
          tiempoInicio: attempt.tiempoInicio,
          mode: attempt.mode || 'ALEATORIO',
          streakCurrent: attempt.streakCurrent || 0,
          streakMax: attempt.streakMax || 0,
          streakTarget: attempt.streakTarget || 30,
        };

        setTestData(normalized);

        if (attempt.respuestas?.length) {
          const restored = attempt.respuestas.reduce((acc, r) => {
            acc[r.preguntaId] = r.respuestaUsuario || '';
            return acc;
          }, {});
          setRespuestas(restored);
        }

        // Cachear solo si son válidas
        localStorage.setItem(`test_${attemptId}`, JSON.stringify(normalized));
      } catch (err) {
        setError(err.message || 'Error al cargar el test');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      loadTest();
    }
  }, [attemptId]);

  return {
    testData,
    setTestData,
    respuestas,
    setRespuestas,
    loading,
    error,
    setError,
  };
};
