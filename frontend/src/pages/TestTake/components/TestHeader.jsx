import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, LinearProgress, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';

export const TestHeader = ({
  currentQuestionIndex,
  totalQuestions,
  isManicomio,
  streakTarget,
  elapsedTime,
  tiempoRestante,
  isPaused,
  onTogglePause,
  progress,
  viewMode,
  onToggleViewMode,
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            ✍️ Test en Progreso
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
          </Typography>
          {isManicomio && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              MODO MANICOMIO · Necesitas {streakTarget || 30} aciertos seguidos sin dejar en blanco.
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Toggle vista lista/individual (solo si NO es MANICOMIO) */}
          {!isManicomio && (
            <Tooltip title={viewMode === 'list' ? 'Cambiar a vista individual' : 'Cambiar a vista de lista'}>
              <IconButton
                onClick={onToggleViewMode}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
              >
                {viewMode === 'list' ? <ViewAgendaIcon /> : <ViewListIcon />}
              </IconButton>
            </Tooltip>
          )}

          <Paper
            sx={{
              p: 2,
              bgcolor: isPaused ? 'warning.main' : 'primary.main',
              color: 'white',
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              ⏱️ {formatTime(elapsedTime)}
            </Typography>
            <Typography variant="caption">{isPaused ? 'PAUSADO' : 'En ejecución'}</Typography>
          </Paper>

          <Tooltip title={isPaused ? 'Reanudar' : 'Pausar'}>
            <IconButton
              onClick={onTogglePause}
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>

          {!isManicomio && tiempoRestante !== undefined && (
            <Paper
              sx={{
                p: 2,
                bgcolor: tiempoRestante < 0 ? 'error.main' : 'success.main',
                color: 'white',
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                ⏳ {formatTime(Math.max(0, tiempoRestante))}
              </Typography>
              <Typography variant="caption">Tiempo restante (est.)</Typography>
            </Paper>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Progreso</Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
    </>
  );
};
