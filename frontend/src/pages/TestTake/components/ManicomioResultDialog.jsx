import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

export const ManicomioResultDialog = ({
  open,
  result,
  streakTarget,
  favorites,
  tipDraft,
  tipError,
  savingTip,
  ankiSaving,
  ankiGrade,
  ankiError,
  difficultyDraft,
  difficultyError,
  savingDifficulty,
  onClose,
  onReport,
  onToggleFavorite,
  onSaveTip,
  onTipChange,
  onAnkiGrade,
  onDifficultyChange,
  onSaveDifficulty,
  onContinue,
}) => {
  const pregunta = result?.question;
  const preguntaId = pregunta?.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Resultado</DialogTitle>
      <DialogContent>
        <Alert
          severity={result?.esCorrecta ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {result?.esCorrecta
            ? '✅ Respuesta correcta'
            : '❌ Respuesta incorrecta, la racha se reinicia'}
          {typeof result?.remaining === 'number' && (
            <strong>
              {' '}
              · Te faltan {result.remaining} aciertos para llegar a {streakTarget}.
            </strong>
          )}
        </Alert>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Pregunta respondida:
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {pregunta?.enunciado}
        </Typography>

        {/* Respuestas: usuario vs correcta */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Tu respuesta:</strong>{' '}
              <span style={{ color: result?.esCorrecta ? 'green' : 'red', fontWeight: 'bold' }}>
                {result?.respuestaUsuario}: {result?.textoRespuestaUsuario || 'N/A'}
              </span>
            </Typography>
            {!result?.esCorrecta && (
              <Typography variant="body2">
                <strong>Respuesta correcta:</strong>{' '}
                <span style={{ color: 'green', fontWeight: 'bold' }}>
                  {result?.respuestaCorrecta}: {result?.textoRespuestaCorrecta || 'N/A'}
                </span>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Repaso Anki */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Repaso Anki:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button
            variant={ankiGrade === 'OTRA_VEZ' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => onAnkiGrade('OTRA_VEZ')}
            disabled={ankiSaving || !!ankiGrade}
          >
            Otra vez
          </Button>
          <Button
            variant={ankiGrade === 'DIFICIL' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => onAnkiGrade('DIFICIL')}
            disabled={ankiSaving || !!ankiGrade}
          >
            Difícil
          </Button>
          <Button
            variant={ankiGrade === 'BIEN' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => onAnkiGrade('BIEN')}
            disabled={ankiSaving || !!ankiGrade}
          >
            Bien
          </Button>
          <Button
            variant={ankiGrade === 'FACIL' ? 'contained' : 'outlined'}
            color="info"
            onClick={() => onAnkiGrade('FACIL')}
            disabled={ankiSaving || !!ankiGrade}
          >
            Fácil
          </Button>
        </Box>
        {ankiGrade && (
          <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
            ✅ Marcada como {ankiGrade === 'OTRA_VEZ' ? 'Otra vez' : ankiGrade === 'DIFICIL' ? 'Difícil' : ankiGrade === 'BIEN' ? 'Bien' : 'Fácil'}
            {!result?.esCorrecta && ' (respuesta incorrecta)'}
          </Typography>
        )}
        {ankiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {ankiError}
          </Alert>
        )}

        {/* Dificultad (estilo Repaso Anki) */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Dificultad:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Button
            variant={(difficultyDraft || 'MEDIUM') === 'EASY' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => onDifficultyChange('EASY')}
            disabled={savingDifficulty}
          >
            Fácil
          </Button>
          <Button
            variant={(difficultyDraft || 'MEDIUM') === 'MEDIUM' ? 'contained' : 'outlined'}
            color="info"
            onClick={() => onDifficultyChange('MEDIUM')}
            disabled={savingDifficulty}
          >
            Media
          </Button>
          <Button
            variant={(difficultyDraft || 'MEDIUM') === 'HARD' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => onDifficultyChange('HARD')}
            disabled={savingDifficulty}
          >
            Difícil
          </Button>
          <Button
            variant={(difficultyDraft || 'MEDIUM') === 'ULTRAHARD' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => onDifficultyChange('ULTRAHARD')}
            disabled={savingDifficulty}
          >
            Muy Difícil
          </Button>
        </Box>
        {difficultyError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {difficultyError}
          </Alert>
        )}

        {/* Tip editable */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Tip (puedes editarlo):
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={tipDraft}
          onChange={(e) => onTipChange(e.target.value)}
          placeholder="Añade una pista o mnemotecnia para recordar"
          sx={{ mb: 2 }}
          error={!!tipError}
          helperText={tipError || 'Guárdalo para reutilizar esta pista cuando reaparezca'}
          disabled={savingTip}
        />

        {/* Explicación */}
        {pregunta?.explicacion && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              Explicación:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {pregunta.explicacion}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => preguntaId && onReport(pregunta)}
          >
            Reportar esta pregunta
          </Button>
          <Tooltip title={favorites[preguntaId] ? 'Quitar de favoritos' : 'Marcar como favorita'}>
            <span>
              <IconButton
                onClick={() => preguntaId && onToggleFavorite(preguntaId)}
                disabled={!preguntaId}
                color="warning"
              >
                {favorites[preguntaId] ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onSaveTip}
            disabled={savingTip}
          >
            {savingTip ? 'Guardando...' : 'Guardar tip'}
          </Button>
          <Button
            variant="outlined"
            onClick={onSaveDifficulty}
            disabled={savingDifficulty}
          >
            {savingDifficulty ? 'Aplicando...' : 'Guardar dificultad'}
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={onContinue}
            disabled={!ankiGrade || ankiSaving}
          >
            Continuar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
