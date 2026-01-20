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
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

export const QuestionActions = ({
  currentQuestion,
  isFavorite,
  onReport,
  onToggleFavorite,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
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

export const ReportDialog = ({
  open,
  onClose,
  onSubmit,
  reportingQuestion,
  submitting,
}) => {
  const [reportMessage, setReportMessage] = useState('');

  const handleSubmit = () => {
    onSubmit(reportMessage);
    setReportMessage('');
  };

  const handleClose = () => {
    setReportMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>🚩 Reportar Pregunta</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Cuéntanos qué problema tiene esta pregunta. Puede ser un error en el enunciado, respuesta incorrecta, ambigüedad, etc.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe el problema..."
            value={reportMessage}
            onChange={(e) => setReportMessage(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
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
          disabled={submitting || !reportMessage.trim()}
        >
          {submitting ? 'Enviando...' : 'Enviar Reporte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
