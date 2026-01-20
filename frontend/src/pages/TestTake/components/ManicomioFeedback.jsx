import React from 'react';
import { Alert, Box, Stack, Chip, Card, CardContent, Typography } from '@mui/material';

export const ManicomioFeedback = ({ feedback, streakCurrent, streakMax, streakTarget }) => {
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
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            🔥 Racha actual
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={`Actual: ${streakCurrent}`} color="primary" />
            <Chip label={`Máxima: ${streakMax}`} color="secondary" />
            <Chip label={`Faltan: ${Math.max(streakTarget - streakCurrent, 0)}`} color="success" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
