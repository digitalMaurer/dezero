import React from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export const AdminPreguntasImportText = ({
  importText,
  setImportText,
  importIsOfficial,
  setImportIsOfficial,
  selectedOposicion,
  setSelectedOposicion,
  selectedTema,
  setSelectedTema,
  oposiciones,
  temas,
  loading,
  handleImport,
}) => {
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(
      'Genera [CANTIDAD] preguntas tipo test sobre: [TEMA].\nDevuelve SOLO texto plano, una pregunta por línea, sin numeración adicional ni explicaciones.\nFormato EXACTO por línea (usa | como separador):\nID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip\nReglas:\n- ID: número correlativo (1,2,3,...)\n- respuestaCorrecta: solo A, B, C o D (en MAYÚSCULA).\n- Una línea por pregunta, sin texto extra antes o después.\nEjemplo:\n1|¿Cuál es la capital de Francia?|Madrid|París|Berlín|Roma|B|París es la capital de Francia|Usa la mnemotecnia “Ciudad de la Luz”'
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Importar Preguntas (Formato Texto)
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Formato: <code>ID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip</code>
        </Typography>
        <Alert severity="info">
          La respuesta correcta debe ser: A, B, C o D
        </Alert>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Prompt sugerido para generar preguntas con IA
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Copia este texto y pégalo en tu IA favorita. Luego pega la salida aquí.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={5}
          value={`Genera [CANTIDAD] preguntas tipo test sobre: [TEMA].\nDevuelve SOLO texto plano, una pregunta por línea, sin numeración adicional ni explicaciones.\nFormato EXACTO por línea (usa | como separador):\nID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip\nReglas:\n- ID: número correlativo (1,2,3,...)\n- respuestaCorrecta: solo A, B, C o D (en MAYÚSCULA).\n- Una línea por pregunta, sin texto extra antes o después.\nEjemplo:\n1|¿Cuál es la capital de Francia?|Madrid|París|Berlín|Roma|B|París es la capital de Francia|Usa la mnemotecnia “Ciudad de la Luz”`}
          inputProps={{ readOnly: true }}
          sx={{ fontFamily: 'monospace', mb: 1 }}
        />
        <Box>
          <Button size="small" onClick={handleCopyPrompt}>
            Copiar prompt
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Oposición</InputLabel>
          <Select
            value={selectedOposicion}
            onChange={(e) => {
              setSelectedOposicion(e.target.value);
              setSelectedTema('');
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

        <FormControl fullWidth disabled={!selectedOposicion}>
          <InputLabel>Tema</InputLabel>
          <Select
            value={selectedTema}
            onChange={(e) => setSelectedTema(e.target.value)}
            label="Tema"
          >
            {temas.map((tema) => (
              <MenuItem key={tema.id} value={tema.id}>
                {tema.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Checkbox
            checked={importIsOfficial}
            onChange={(e) => setImportIsOfficial(e.target.checked)}
          />
        }
        label="Marcar todas como oficiales"
      />

      <TextField
        fullWidth
        multiline
        rows={10}
        placeholder={`Ejemplo:\n1|¿Cuál es la capital de España?|Madrid|Barcelona|Valencia|Sevilla|A|Madrid es la capital|Pista útil\n2|¿Cuánto es 2+2?|3|4|5|6|B|||`}
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleImport}
          disabled={loading}
        >
          {loading ? 'Importando...' : 'Importar Preguntas'}
        </Button>
        <Button variant="outlined" onClick={() => setImportText('')}>
          Limpiar
        </Button>
      </Box>
    </Paper>
  );
};
