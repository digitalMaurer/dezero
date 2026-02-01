import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

export const QuestionActions = ({
  currentQuestion,
  isFavorite,
  onReport,
  onToggleFavorite,
  onToggleOficial,
  canToggleOficial = false,
  updatingOficial = false,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
      <Tooltip title={canToggleOficial ? 'Cambiar oficialidad' : 'Oficialidad de la pregunta'}>
        <span>
          <Chip
            clickable={canToggleOficial}
            onClick={canToggleOficial ? () => onToggleOficial?.(currentQuestion) : undefined}
            label={currentQuestion?.esOficial ? 'Oficial' : 'No oficial'}
            size="medium"
            color={currentQuestion?.esOficial ? 'primary' : 'default'}
            variant={currentQuestion?.esOficial ? 'outlined' : 'filled'}
            disabled={updatingOficial}
            sx={{
              px: 1,
              fontWeight: 600,
              borderRadius: 999,
              boxShadow: currentQuestion?.esOficial ? 1 : 0,
            }}
          />
        </span>
      </Tooltip>
      <Tooltip title="Reportar problema con esta pregunta">
        <Button
          variant="outlined"
          color="warning"
          startIcon={<FlagIcon />}
          onClick={() => onReport(currentQuestion)}
          size="small"
        >
          Reportar
        </Button>
      </Tooltip>
      <Tooltip title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorita'}>
        <IconButton
          color={isFavorite ? 'primary' : 'default'}
          onClick={() => onToggleFavorite(currentQuestion.id)}
          size="small"
        >
          {isFavorite ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const REPORT_REASONS = [
  {
    value: 'ERROR_ENUNCIADO',
    label: '📝 Error en enunciado',
    description: 'Hay errores de ortografía, gramática o está mal redactado',
    allowCustom: false,
  },
  {
    value: 'RESPUESTA_INCORRECTA',
    label: '❌ Respuesta incorrecta',
    description: 'La respuesta marcada como correcta es incorrecta',
    allowCustom: false,
  },
  {
    value: 'AMBIGUEDAD',
    label: '🤔 Ambigüedad',
    description: 'La pregunta es confusa o tiene múltiples interpretaciones',
    allowCustom: false,
  },
  {
    value: 'PREGUNTA_DUPLICADA',
    label: '♻️ Pregunta duplicada',
    description: 'Esta pregunta ya existe en el sistema',
    allowCustom: false,
  },
  {
    value: 'OTRO',
    label: '⚙️ Otro problema',
    description: 'Otro problema no mencionado arriba',
    allowCustom: true,
  },
];

export const ReportDialog = ({
  open,
  onClose,
  onSubmit,
  reportingQuestion,
  submitting,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  const selectedReasonData = REPORT_REASONS.find((r) => r.value === selectedReason);

  const handleSubmit = () => {
    if (!selectedReason) {
      alert('Por favor selecciona un motivo de reporte');
      return;
    }
    onSubmit({
      motivo: selectedReason,
      mensaje: selectedReason === 'OTRO' ? reportMessage : selectedReasonData?.description || '',
    });
    setSelectedReason('');
    setReportMessage('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setReportMessage('');
    onClose();
  };

  const isFormValid = selectedReason && (selectedReason !== 'OTRO' || reportMessage.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>🚩 Reportar Pregunta</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="textSecondary">
            Selecciona qué tipo de problema tiene esta pregunta:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {REPORT_REASONS.map((reason) => (
              <Paper
                key={reason.value}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  border: selectedReason === reason.value ? '2px solid' : '1px solid',
                  borderColor: selectedReason === reason.value ? 'warning.main' : 'divider',
                  backgroundColor: selectedReason === reason.value ? 'warning.lighter' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'warning.main',
                  },
                }}
                onClick={() => {
                  setSelectedReason(reason.value);
                  if (!reason.allowCustom) {
                    setReportMessage('');
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {reason.label}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {reason.description}
                </Typography>
              </Paper>
            ))}
          </Box>

          {selectedReason === 'OTRO' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Describe el problema:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Cuéntanos en detalle qué problema has encontrado..."
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          )}

          <Typography variant="caption" color="textSecondary">
            Tu reporte es anónimo y nos ayuda a mejorar la calidad del sistema.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning" 
          disabled={submitting || !isFormValid}
        >
          {submitting ? 'Enviando...' : 'Enviar Reporte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
