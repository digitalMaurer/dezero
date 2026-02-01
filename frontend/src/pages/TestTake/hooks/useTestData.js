import { useState, useEffect } from 'react';
import { testsService } from '../../../services/apiServices';
import { safeSetItem } from '../../../utils/localStorageManager';

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const useTestData = (attemptId) => {
  const [testData, setTestData] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validar que la pregunta tenga los campos mínimos para mostrarse
  // NO validar respuestaCorrecta porque no se envía por seguridad en createTestAttempt
  const isPreguntaValid = (p) => p && p.id && p.titulo; // validar solo mínimos para no descartar preguntas

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
          const cacheIsValid = Array.isArray(parsed.preguntas)
            && parsed.preguntas.every(isPreguntaValid)
            && parsed.preguntas.every((p) => p?.tema?.nombre)
            && parsed.preguntas.every((p) => typeof p?.esOficial === 'boolean');
          if (cacheIsValid) {
            const normalized = {
              ...parsed,
              preguntas:
                parsed.mode === 'MANICOMIO' && Array.isArray(parsed.preguntas)
                  ? shuffleArray(parsed.preguntas)
                  : parsed.preguntas,
            };
            setTestData(normalized);
            const savedAnswers = localStorage.getItem(`test_answers_${attemptId}`);
            if (savedAnswers) {
              setRespuestas(JSON.parse(savedAnswers));
            }
            safeSetItem(`test_${attemptId}`, JSON.stringify(normalized));
            setLoading(false);
            return;
          }
        }

        // Si no está en cache (o es inválido), cargar del servidor
        const response = await testsService.getAttempt(attemptId);
        const attempt = response.data?.attempt || response.attempt || response;

        console.debug('[useTestData] response completo:', response);
        console.debug('[useTestData] attempt:', attempt);
        console.debug('[useTestData] attempt.test:', attempt?.test);
        console.debug('[useTestData] attempt.test.questions:', attempt?.test?.questions);

        if (!attempt) {
          throw new Error('Intento inválido');
        }

        const mapPreguntas = (arr) => {
          const rawMapped = (arr || [])
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((q) => {
              const base = q.pregunta || q; // soportar ambas formas: {pregunta, orden} o pregunta plana
              const mapped = {
                id: base?.id,
                titulo: base?.titulo,
                enunciado: base?.enunciado,
                opcionA: base?.opcionA,
                opcionB: base?.opcionB,
                opcionC: base?.opcionC,
                opcionD: base?.opcionD,
                dificultad: base?.dificultad,
                orden: q.orden || base?.orden || 0,
                respuestaCorrecta: base?.respuestaCorrecta,
                tema: base?.tema,
                esOficial: base?.esOficial ?? false,
              };
              console.debug('[useTestData] mapped:', mapped);
              console.debug('[useTestData] isPreguntaValid:', isPreguntaValid(mapped));
              return mapped;
            });

          const valid = rawMapped.filter(isPreguntaValid);

          // Fallback: si no hay válidas pero sí hay mapeadas, usar las mapeadas rellenando strings vacíos
          if (valid.length === 0 && rawMapped.length > 0) {
            console.warn('[useTestData] Ninguna pregunta pasó la validación. Usando fallback y rellenando campos vacíos.');
            return rawMapped.map((p) => ({
              id: p.id,
              titulo: p.titulo || 'Pregunta',
              enunciado: p.enunciado || 'Enunciado no disponible',
              opcionA: p.opcionA || 'Opción A',
              opcionB: p.opcionB || 'Opción B',
              opcionC: p.opcionC || 'Opción C',
              opcionD: p.opcionD || null,
              dificultad: p.dificultad || 'media',
              orden: p.orden || 0,
              respuestaCorrecta: p.respuestaCorrecta,
              tema: p.tema,
              esOficial: typeof p.esOficial === 'boolean' ? p.esOficial : false,
            }));
          }

          return valid;
        };

        let preguntas = [];

        // Forma estándar al consultar getAttempt
        if (Array.isArray(attempt.test?.questions)) {
          preguntas = mapPreguntas(attempt.test.questions);
          console.debug('[useTestData] preguntas (test.questions):', preguntas);
        }

        // Forma cuando viene directo en data.preguntas (createTestAttempt inicial)
        if (!preguntas.length && Array.isArray(attempt.preguntas)) {
          preguntas = mapPreguntas(attempt.preguntas);
          console.debug('[useTestData] preguntas (attempt.preguntas):', preguntas);
        }

        // Forma defensiva por si la respuesta viniera anidada en data.data.preguntas
        if (!preguntas.length && Array.isArray(response?.data?.preguntas)) {
          preguntas = mapPreguntas(response.data.preguntas);
          console.debug('[useTestData] preguntas (response.data.preguntas):', preguntas);
        }

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

        const normalizedWithShuffle = {
          ...normalized,
          preguntas:
            normalized.mode === 'MANICOMIO' && Array.isArray(normalized.preguntas)
              ? shuffleArray(normalized.preguntas)
              : normalized.preguntas,
        };

        setTestData(normalizedWithShuffle);

        if (attempt.respuestas?.length) {
          const restored = attempt.respuestas.reduce((acc, r) => {
            acc[r.preguntaId] = r.respuestaUsuario || '';
            return acc;
          }, {});
          setRespuestas(restored);
        }

        // Cachear solo si son válidas
        safeSetItem(`test_${attemptId}`, JSON.stringify(normalizedWithShuffle));
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
