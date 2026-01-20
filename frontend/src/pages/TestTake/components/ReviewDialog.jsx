import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Alert,
  Box,
} from '@mui/material';

export const ReviewDialog = ({
  open,
  onClose,
  onConfirm,
  respondidas,
  totalPreguntas,
  elapsedTime,
  submitting,
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const noRespondidas = totalPreguntas - respondidas;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>📋 Revisar Antes de Enviar</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Estás a punto de finalizar el test.
          </Typography>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2">
                  <strong>Respondidas:</strong> {respondidas} / {totalPreguntas}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Tiempo:</strong> {formatTime(elapsedTime)}
                </Typography>
              </CardContent>
            </Card>

            {noRespondidas > 0 && (
              <Alert severity="warning">
                ⚠️ Tienes {noRespondidas} pregunta(s) sin responder. Serán contadas como incorrectas.
              </Alert>
            )}

            <Typography variant="body2" color="textSecondary">
              ¿Deseas continuar y finalizar el test?
            </Typography>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Volver a Revisar</Button>
        <Button onClick={onConfirm} variant="contained" color="success" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Confirmar y Finalizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
