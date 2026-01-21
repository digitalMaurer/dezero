// useTestTimer: controla tiempo transcurrido/pausa y estima tiempo total según número de preguntas
import { useEffect, useMemo, useState, useCallback } from 'react';

export const useTestTimer = ({ tiempoInicio, questionCount }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || !tiempoInicio) return;
    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isPaused, tiempoInicio]);

  // Recalcular si cambia el intento (p. ej. otro attemptId)
  useEffect(() => {
    setElapsedTime(0);
  }, [tiempoInicio]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const tiempoEstimado = useMemo(() => {
    if (!questionCount) return 0;
    return questionCount * 120; // 2 min por pregunta
  }, [questionCount]);

  const tiempoRestante = tiempoEstimado - elapsedTime;

  return {
    elapsedTime,
    isPaused,
    togglePause,
    tiempoEstimado,
    tiempoRestante,
  };
};
