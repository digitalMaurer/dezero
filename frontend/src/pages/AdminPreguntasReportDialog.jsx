import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getDifficultyLabel, getDifficultyColor } from '../utils/difficulty';

export const AdminPreguntasReportDialog = ({
  open,
  viewingReport,
  onClose,
  onEdit,
  onDeleteQuestion,
  onRemoveReport,
}) => {
  if (!viewingReport) {
    return null;
  }

  const handleClose = () => {
    onClose?.();
  };

  const handleEditClick = async () => {
    if (!onEdit || !viewingReport?.pregunta?.id) return;
    await onEdit(viewingReport);
  };

  const pregunta = viewingReport.pregunta;

  const handleDeleteQuestion = async () => {
    if (!pregunta?.id) return;
    if (window.confirm('¿Seguro que quieres eliminar la pregunta y todos sus reportes?')) {
      await onDeleteQuestion?.(pregunta.id);
    }
  };

  const handleRemoveReport = async () => {
    if (!viewingReport?.id) return;
    if (window.confirm('¿Seguro que quieres quitar solo este reporte?')) {
      await onRemoveReport?.(viewingReport.id);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>🚩 Detalle del Reporte</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              ⚠️ Reporte
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Usuario:</strong> {viewingReport.user?.nombre} ({viewingReport.user?.email})
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Fecha:</strong> {new Date(viewingReport.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>Problema reportado:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
              {viewingReport.descripcion}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              ❓ Pregunta Reportada
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Enunciado:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
              {pregunta?.enunciado}
            </Typography>


            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción A:</Typography>
                <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {pregunta?.opcionA ? pregunta.opcionA : <span style={{ color: '#aaa' }}>Sin definir</span>}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción B:</Typography>
                <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {pregunta?.opcionB ? pregunta.opcionB : <span style={{ color: '#aaa' }}>Sin definir</span>}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción C:</Typography>
                <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {pregunta?.opcionC ? pregunta.opcionC : <span style={{ color: '#aaa' }}>Sin definir</span>}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción D:</Typography>
                <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {pregunta?.opcionD ? pregunta.opcionD : <span style={{ color: '#aaa' }}>Sin definir</span>}
                </Typography>
              </Box>
            </Box>

            {pregunta?.respuestaCorrecta && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Respuesta Correcta:</strong>{' '}
                <Chip label={pregunta.respuestaCorrecta} color="success" size="small" />
              </Typography>
            )}

            {pregunta?.explicacion && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Explicación:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {pregunta?.explicacion}
                </Typography>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`Tema: ${pregunta?.tema?.nombre}`} size="small" />
              <Chip label={`Oposición: ${pregunta?.tema?.oposicion?.nombre}`} size="small" />
              <Chip
                label={`Dificultad: ${getDifficultyLabel(pregunta?.dificultad)}`}
                color={getDifficultyColor(pregunta?.dificultad)}
                size="small"
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
          <Button onClick={handleClose} color="inherit">Cerrar</Button>
          <Button variant="contained" onClick={handleEditClick} startIcon={<EditIcon />} disabled={!pregunta?.id}>
            Editar Pregunta
          </Button>
          <Button color="error" variant="outlined" onClick={handleDeleteQuestion} disabled={!pregunta?.id}>
            Eliminar Pregunta
          </Button>
          <Button color="warning" variant="outlined" onClick={handleRemoveReport}>
            Quitar Reporte
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
