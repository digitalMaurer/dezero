import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';

export const QuestionDisplay = ({
  question,
  respuesta,
  onRespuestaChange,
  disabled = false,
}) => {
  if (!question) {
    return <Typography>Cargando pregunta...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {question.titulo}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {question.enunciado}
        </Typography>
      </Box>

      <FormControl component="fieldset">
        <RadioGroup
          value={respuesta || ''}
          onChange={(e) => onRespuestaChange(e.target.value)}
          disabled={disabled}
        >
          {['A', 'B', 'C', 'D'].map((opcion) => {
            const textoOpcion = question[`opcion${opcion}`];
            if (!textoOpcion) return null;

            return (
              <FormControlLabel
                key={opcion}
                value={opcion}
                control={<Radio />}
                label={textoOpcion}
                sx={{ mb: 1 }}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    </Box>
  );
};
