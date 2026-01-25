import { useState, useEffect, useCallback } from 'react';
import { preguntasService, favoritesService, ankiService } from '../../../services/apiServices';

export const useQuestionMeta = ({
  attemptId,
  pendingManicomioResult,
  setPendingManicomioResult,
  setTestData,
}) => {
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [favorites, setFavorites] = useState({});

  const [tipDraft, setTipDraft] = useState('');
  const [savingTip, setSavingTip] = useState(false);
  const [tipError, setTipError] = useState(null);

  const [ankiSaving, setAnkiSaving] = useState(false);
  const [ankiGrade, setAnkiGrade] = useState(null);
  const [ankiError, setAnkiError] = useState(null);

  // Dificultad (cambio desde el modal MANICOMIO)
  const [difficultyDraft, setDifficultyDraft] = useState('MEDIUM');
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [difficultyError, setDifficultyError] = useState(null);

  // Sincronizar tip/anki cuando llega un resultado MANICOMIO
  useEffect(() => {
    if (pendingManicomioResult?.question) {
      setTipDraft(pendingManicomioResult.question.tip || '');
      setTipError(null);
      setAnkiGrade(null);
      setAnkiError(null);
      setDifficultyDraft(pendingManicomioResult.question.dificultad || 'MEDIUM');
      setDifficultyError(null);

      // Preselección automática de Anki basada en resultado y dificultad
      try {
        const esCorrecta = !!pendingManicomioResult.esCorrecta;
        const dificultad = pendingManicomioResult.question.dificultad || 'MEDIUM';
        let recomendado = 'OTRA_VEZ';
        if (esCorrecta) {
          if (dificultad === 'EASY' || dificultad === 'MEDIUM') recomendado = 'FACIL';
          else if (dificultad === 'HARD') recomendado = 'BIEN';
          else if (dificultad === 'ULTRAHARD') recomendado = 'DIFICIL';
        }
        // Persistir automáticamente la valoración recomendada
        // Nota: el handler ajusta a 'OTRA_VEZ' si fue incorrecta
        handleManicomioAnkiGrade(recomendado);
      } catch (e) {
        // Silenciar errores en auto-preselección para no interrumpir flujo
        console.warn('Auto-preselección Anki no aplicada:', e);
      }
    }
  }, [pendingManicomioResult?.question]);

  const handleReportClick = useCallback((question) => {
    setReportingQuestion(question);
    setOpenReportDialog(true);
  }, []);

  const handleSubmitReport = useCallback(
    async (mensaje) => {
      if (!mensaje?.trim() || !reportingQuestion) {
        return;
      }

      setReportSubmitting(true);

      try {
        await preguntasService.reportQuestion(reportingQuestion.id, {
          mensaje,
          attemptId,
        });

        setOpenReportDialog(false);
        setReportingQuestion(null);
        alert('✅ Pregunta reportada. Gracias por ayudarnos a mejorar.');
      } catch (err) {
        alert('Error al reportar la pregunta');
        console.error(err);
      } finally {
        setReportSubmitting(false);
      }
    },
    [attemptId, reportingQuestion]
  );

  const handleToggleFavorite = useCallback(async (preguntaId) => {
    try {
      const response = await favoritesService.toggle(preguntaId);
      const isFavorite = response.data?.isFavorite;
      setFavorites((prev) => ({ ...prev, [preguntaId]: isFavorite }));
    } catch (err) {
      console.error('Error al actualizar favorito:', err);
    }
  }, []);

  const handleSaveTip = useCallback(async () => {
    if (!pendingManicomioResult?.question?.id) return;
    const questionId = pendingManicomioResult.question.id;
    setSavingTip(true);
    setTipError(null);
    try {
      await preguntasService.update(questionId, { tip: tipDraft });

      setPendingManicomioResult((prev) =>
        prev
          ? {
              ...prev,
              question: {
                ...prev.question,
                tip: tipDraft,
              },
            }
          : prev
      );

      setTestData((prev) => {
        if (!prev?.preguntas) return prev;
        return {
          ...prev,
          preguntas: prev.preguntas.map((p) =>
            p.id === questionId ? { ...p, tip: tipDraft } : p
          ),
        };
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar el tip';
      setTipError(msg);
      console.error(err);
    } finally {
      setSavingTip(false);
    }
  }, [pendingManicomioResult?.question?.id, tipDraft, setPendingManicomioResult, setTestData]);

  const handleManicomioAnkiGrade = useCallback(
    async (grade) => {
      if (!pendingManicomioResult?.question?.id) return;
      const preguntaId = pendingManicomioResult.question.id;
      const finalGrade = pendingManicomioResult.esCorrecta ? grade : 'OTRA_VEZ';

      try {
        setAnkiSaving(true);
        setAnkiError(null);
        await ankiService.updateQuestionGrade(preguntaId, finalGrade);
        setAnkiGrade(finalGrade);
      } catch (err) {
        console.error('Error al actualizar Anki:', err);
        setAnkiError('❌ Error al guardar la valoración Anki');
      } finally {
        setAnkiSaving(false);
      }
    },
    [pendingManicomioResult?.question?.id, pendingManicomioResult?.esCorrecta]
  );

  const handleSaveDifficulty = useCallback(async () => {
    if (!pendingManicomioResult?.question?.id) return;
    const questionId = pendingManicomioResult.question.id;
    try {
      setSavingDifficulty(true);
      setDifficultyError(null);
      await preguntasService.update(questionId, { dificultad: difficultyDraft });

      // Actualizar estado local del modal
      setPendingManicomioResult((prev) =>
        prev
          ? {
              ...prev,
              question: {
                ...prev.question,
                dificultad: difficultyDraft,
              },
            }
          : prev
      );

      // Actualizar pregunta en el test
      setTestData((prev) => {
        if (!prev?.preguntas) return prev;
        return {
          ...prev,
          preguntas: prev.preguntas.map((p) =>
            p.id === questionId ? { ...p, dificultad: difficultyDraft } : p
          ),
        };
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar la dificultad';
      setDifficultyError(msg);
      console.error(err);
    } finally {
      setSavingDifficulty(false);
    }
  }, [pendingManicomioResult?.question?.id, difficultyDraft, setPendingManicomioResult, setTestData]);

  return {
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
  };
};
