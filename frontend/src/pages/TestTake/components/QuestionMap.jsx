import React from 'react';
import { Card, CardContent, Typography, Stack, Box, Chip, Grid, Button, Tooltip } from '@mui/material';

export const QuestionMap = ({ 
  preguntas, 
  respuestas, 
  currentQuestionIndex, 
  onGoToQuestion 
}) => {
  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            📊 Resumen
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Respondidas:</Typography>
              <Chip 
                label={Object.keys(respuestas).length} 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Sin responder:</Typography>
              <Chip 
                label={preguntas.length - Object.keys(respuestas).length} 
                color="warning" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            🗺️ Mapa de Preguntas
          </Typography>
          <Grid container spacing={1}>
            {preguntas.map((pregunta, index) => {
              const isAnswered = Object.prototype.hasOwnProperty.call(respuestas, pregunta.id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <Grid item xs={3} key={pregunta.id}>
                  <Tooltip title={`${isAnswered ? 'Respondida' : 'Sin responder'}`}>
                    <Button
                      fullWidth
                      variant={isCurrent ? 'contained' : 'outlined'}
                      color={isCurrent ? 'primary' : 'inherit'}
                      size="small"
                      onClick={() => onGoToQuestion(index)}
                      sx={{ 
                        minHeight: '45px', 
                        fontSize: '0.75rem', 
                        fontWeight: isCurrent || isAnswered ? 'bold' : 'normal',
                        bgcolor: isCurrent ? undefined : (isAnswered ? 'success.light' : undefined),
                        color: isCurrent ? undefined : (isAnswered ? 'success.dark' : undefined),
                      }}
                    >
                      {isAnswered ? '✓' : '—'}
                      <br />
                      {index + 1}
                    </Button>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            ✓ = Respondida | — = Sin responder
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};
