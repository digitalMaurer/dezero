import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';

export const AdminPreguntasEditDialog = ({
  open,
  onClose,
  editingPregunta,
  setEditingPregunta,
  temasEdicion,
  onSave,
  onDelete,
}) => {
  const handleDeleteClick = async () => {
    if (!editingPregunta?.id || !onDelete) return;
    await onDelete(editingPregunta.id);
    onClose?.();
  };

  const handleSaveClick = async () => {
    if (!onSave) return;
    await onSave();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Pregunta</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {editingPregunta && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Enunciado"
              fullWidth
              multiline
              rows={3}
              value={editingPregunta.enunciado}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, enunciado: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Tema</InputLabel>
              <Select
                value={editingPregunta.temaId || editingPregunta.tema?.id || ''}
                onChange={(e) => setEditingPregunta({ ...editingPregunta, temaId: e.target.value })}
                label="Tema"
              >
                {temasEdicion.map((tema) => (
                  <MenuItem key={tema.id} value={tema.id}>
                    {tema.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Opción A"
              fullWidth
              value={editingPregunta.opcionA}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, opcionA: e.target.value })}
            />
            <TextField
              label="Opción B"
              fullWidth
              value={editingPregunta.opcionB}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, opcionB: e.target.value })}
            />
            <TextField
              label="Opción C"
              fullWidth
              value={editingPregunta.opcionC}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, opcionC: e.target.value })}
            />
            <TextField
              label="Opción D"
              fullWidth
              value={editingPregunta.opcionD}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, opcionD: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Respuesta Correcta</InputLabel>
              <Select
                value={editingPregunta.respuestaCorrecta || ''}
                onChange={(e) =>
                  setEditingPregunta({
                    ...editingPregunta,
                    respuestaCorrecta: e.target.value,
                  })
                }
                label="Respuesta Correcta"
              >
                <MenuItem value="" disabled>
                  Selecciona
                </MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Explicación"
              fullWidth
              multiline
              rows={2}
              value={editingPregunta.explicacion || ''}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, explicacion: e.target.value })}
            />
            <TextField
              label="Tip"
              fullWidth
              value={editingPregunta.tip || ''}
              onChange={(e) => setEditingPregunta({ ...editingPregunta, tip: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Dificultad</InputLabel>
              <Select
                value={editingPregunta.dificultad || 'MEDIUM'}
                onChange={(e) => setEditingPregunta({ ...editingPregunta, dificultad: e.target.value })}
                label="Dificultad"
              >
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="MEDIUM">Media</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
                <MenuItem value="ULTRAHARD">Muy Difícil</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="error" variant="outlined" disabled={!editingPregunta?.id} onClick={handleDeleteClick}>
          Eliminar
        </Button>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSaveClick} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
