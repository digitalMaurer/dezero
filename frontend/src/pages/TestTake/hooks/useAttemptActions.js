import { useState, useCallback } from 'react';
import { testsService } from '../../../services/apiServices';

export const useAttemptActions = ({ attemptId, testData, respuestas, navigate }) => {
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openSurrenderDialog, setOpenSurrenderDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [surrendering, setSurrendering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFinishClick = useCallback(() => {
    setOpenReviewDialog(true);
  }, []);

  const handleSubmit = useCallback(async () => {
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
  }, [attemptId, respuestas, testData, navigate]);

  const handleDeleteTestAttempt = useCallback(async () => {
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
  }, [attemptId, navigate]);

  const handleSurrenderAttempt = useCallback(async () => {
    setSurrendering(true);
    setError(null);

    try {
      await testsService.finishAttempt(attemptId);
      localStorage.removeItem(`test_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);
      setOpenSurrenderDialog(false);
      navigate(`/test/results/${attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al finalizar el test');
      console.error(err);
    } finally {
      setSurrendering(false);
    }
  }, [attemptId, navigate]);

  return {
    openReviewDialog,
    setOpenReviewDialog,
    openDeleteDialog,
    setOpenDeleteDialog,
    openSurrenderDialog,
    setOpenSurrenderDialog,
    deleting,
    surrendering,
    submitting,
    error,
    setError,
    handleFinishClick,
    handleSubmit,
    handleDeleteTestAttempt,
    handleSurrenderAttempt,
  };
};
