import React from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';

export const AdminPreguntasImportImage = ({
  oposiciones,
  selectedOposicionImage,
  setSelectedOposicionImage,
  selectedTemaImage,
  setSelectedTemaImage,
  temasImagen,
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  imageForm,
  setImageForm,
  uploadingImage,
  loading,
  handleCreateWithImage,
}) => {
  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetImageForm = () => {
    setImageForm({
      titulo: '',
      enunciado: '',
      opcionA: '',
      opcionB: '',
      opcionC: '',
      opcionD: '',
      respuestaCorrecta: 'A',
      explicacion: '',
      tip: '',
      dificultad: 'MEDIUM',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Importar Pregunta con Imagen
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Oposición</InputLabel>
          <Select
            value={selectedOposicionImage}
            onChange={(e) => {
              setSelectedOposicionImage(e.target.value);
              setSelectedTemaImage('');
            }}
            label="Oposición"
          >
            {oposiciones.map((op) => (
              <MenuItem key={op.id} value={op.id}>
                {op.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!selectedOposicionImage}>
          <InputLabel>Tema</InputLabel>
          <Select
            value={selectedTemaImage}
            onChange={(e) => setSelectedTemaImage(e.target.value)}
            label="Tema"
          >
            {temasImagen.map((tema) => (
              <MenuItem key={tema.id} value={tema.id}>
                {tema.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          1. Añadir imagen
        </Typography>
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Seleccionar imagen
          <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
        </Button>
        {imagePreview && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px', border: '2px solid #ccc', borderRadius: '8px' }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          2. Crear pregunta
        </Typography>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            fullWidth
            label="Título (opcional)"
            value={imageForm.titulo}
            onChange={(e) => setImageForm({ ...imageForm, titulo: e.target.value })}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Enunciado *"
            value={imageForm.enunciado}
            onChange={(e) => setImageForm({ ...imageForm, enunciado: e.target.value })}
          />
          <TextField
            fullWidth
            label="Opción A *"
            value={imageForm.opcionA}
            onChange={(e) => setImageForm({ ...imageForm, opcionA: e.target.value })}
          />
          <TextField
            fullWidth
            label="Opción B *"
            value={imageForm.opcionB}
            onChange={(e) => setImageForm({ ...imageForm, opcionB: e.target.value })}
          />
          <TextField
            fullWidth
            label="Opción C *"
            value={imageForm.opcionC}
            onChange={(e) => setImageForm({ ...imageForm, opcionC: e.target.value })}
          />
          <TextField
            fullWidth
            label="Opción D (opcional)"
            value={imageForm.opcionD}
            onChange={(e) => setImageForm({ ...imageForm, opcionD: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Respuesta Correcta *</InputLabel>
            <Select
              value={imageForm.respuestaCorrecta}
              label="Respuesta Correcta *"
              onChange={(e) => setImageForm({ ...imageForm, respuestaCorrecta: e.target.value })}
            >
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Explicación (opcional)"
            value={imageForm.explicacion}
            onChange={(e) => setImageForm({ ...imageForm, explicacion: e.target.value })}
          />
          <TextField
            fullWidth
            label="Tip (opcional)"
            value={imageForm.tip}
            onChange={(e) => setImageForm({ ...imageForm, tip: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Dificultad</InputLabel>
            <Select
              value={imageForm.dificultad}
              label="Dificultad"
              onChange={(e) => setImageForm({ ...imageForm, dificultad: e.target.value })}
            >
              <MenuItem value="EASY">Fácil</MenuItem>
              <MenuItem value="MEDIUM">Media</MenuItem>
              <MenuItem value="HARD">Difícil</MenuItem>
              <MenuItem value="ULTRAHARD">Muy Difícil</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateWithImage}
          disabled={uploadingImage || loading}
        >
          {uploadingImage ? 'Subiendo...' : 'Crear Pregunta con Imagen'}
        </Button>
        <Button variant="outlined" onClick={resetImageForm}>
          Limpiar
        </Button>
      </Box>
    </Paper>
  );
};
