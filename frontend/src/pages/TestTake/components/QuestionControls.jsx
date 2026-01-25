import React from 'react';
import { Box, Button } from '@mui/material';

export const QuestionControls = ({
  isManicomio,
  currentQuestionIndex,
  totalQuestions,
  hasAnswer,
  onPrevious,
  onNext,
  onFinish,
  onManicomioAnswer,
  loading,
  viewMode,
}) => {
  if (isManicomio) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={onManicomioAnswer}
          disabled={loading || !hasAnswer}
          size="large"
        >
          {loading ? 'Procesando...' : 'Responder ✓'}
        </Button>
      </Box>
    );
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isSingleView = viewMode === 'single';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
      <Button
        variant="outlined"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
      >
        ⬅️ Anterior
      </Button>

      {isLastQuestion ? (
        <Button
          variant="contained"
          color="success"
          onClick={onFinish}
          size="large"
        >
          ✅ Finalizar Test
        </Button>
      ) : (
        <Button 
          variant="contained" 
          onClick={onNext}
          disabled={isSingleView && !hasAnswer}
        >
          Siguiente ➡️
        </Button>
      )}
    </Box>
  );
};
