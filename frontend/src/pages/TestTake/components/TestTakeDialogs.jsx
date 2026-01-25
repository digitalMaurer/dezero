// TestTakeDialogs: centraliza todos los diálogos del flujo (revisión, reporte, rendirse, eliminar y modal de resultado Manicomio)
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';
import { ReviewDialog } from './ReviewDialog';
import { ReportDialog } from './QuestionActions';
import { ManicomioResultDialog } from './ManicomioResultDialog';

export const TestTakeDialogs = ({
  review,
  report,
  surrender,
  deletion,
  manicomio,
}) => {
  return (
    <>
      <ReviewDialog
        open={review.open}
        onClose={review.onClose}
        onConfirm={review.onConfirm}
        respondidas={review.respondidas}
        totalPreguntas={review.totalPreguntas}
        elapsedTime={review.elapsedTime}
        submitting={review.submitting}
      />

      <ReportDialog
        open={report.open}
        onClose={report.onClose}
        onSubmit={report.onSubmit}
        reportingQuestion={report.reportingQuestion}
        submitting={report.submitting}
      />

      <Dialog open={surrender.open} onClose={surrender.onClose}>
        <DialogTitle>🏳️ Rendirse</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            ¿Seguro que quieres finalizar el test? Se guardará tu progreso y podrás revisarlo en estadísticas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={surrender.onClose}>Cancelar</Button>
          <Button color="warning" onClick={surrender.onConfirm} disabled={surrender.loading}>
            {surrender.loading ? 'Finalizando...' : 'Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletion.open} onClose={deletion.onClose}>
        <DialogTitle>🗑️ Eliminar Test en Curso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            ¿Seguro que quieres eliminar este test? No se podrá recuperar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deletion.onClose}>Cancelar</Button>
          <Button color="error" onClick={deletion.onConfirm} disabled={deletion.loading}>
            {deletion.loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ManicomioResultDialog
        open={manicomio.open}
        result={manicomio.result}
        streakTarget={manicomio.streakTarget}
        isAnkiMode={manicomio.isAnkiMode}
        favorites={manicomio.favorites}
        tipDraft={manicomio.tipDraft}
        tipError={manicomio.tipError}
        savingTip={manicomio.savingTip}
        ankiSaving={manicomio.ankiSaving}
        ankiGrade={manicomio.ankiGrade}
        ankiError={manicomio.ankiError}
        difficultyDraft={manicomio.difficultyDraft}
        difficultyError={manicomio.difficultyError}
        savingDifficulty={manicomio.savingDifficulty}
        onClose={manicomio.onClose}
        onReport={manicomio.onReport}
        onToggleFavorite={manicomio.onToggleFavorite}
        onSaveTip={manicomio.onSaveTip}
        onTipChange={manicomio.onTipChange}
        onAnkiGrade={manicomio.onAnkiGrade}
        onDifficultyChange={manicomio.onDifficultyChange}
        onSaveDifficulty={manicomio.onSaveDifficulty}
        onContinue={manicomio.onContinue}
      />
    </>
  );
};
