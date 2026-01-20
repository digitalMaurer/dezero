import React from 'react';
import { Alert, Box, Stack, Chip, Card, CardContent } from '@mui/material';

export const ManicomioFeedback = ({ feedback, streakCurrent, streakMax, streakTarget, correctasTotales }) => {
  if (!feedback) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity={feedback.esCorrecta ? 'success' : 'error'} sx={{ mb: 2 }}>
        {feedback.esCorrecta ? '✅ Respuesta correcta' : '❌ Respuesta incorrecta, la racha se reinicia'}
        {typeof feedback.remaining === 'number' && (
          <strong> · Te faltan {feedback.remaining} aciertos para llegar a {streakTarget}.</strong>
        )}
      </Alert>

      <Card sx={{ bgcolor: '#f5f5f5', mb: 2 }}>
        <CardContent>
          <Box sx={{ fontWeight: 'bold', mb: 1 }}>🔥 Progreso</Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={`Correctas totales: ${correctasTotales ?? 0}`} color="success" />
            <Chip label={`Racha actual: ${streakCurrent}`} color="primary" />
            <Chip label={`Máxima racha: ${streakMax}`} color="secondary" />
            <Chip label={`Faltan: ${Math.max(streakTarget - streakCurrent, 0)}`} color="info" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
