// TestActionsBar: muestra acciones principales del test (rendirse, eliminar y exportar PDF) con tooltips
import React from 'react';
import { Box, Button, Tooltip, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export const TestActionsBar = ({
  onSurrender,
  onDelete,
  onExportPDF,
  onToggleTema,
  showTema,
  surrendering,
  deleting,
  exportingPDF,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
      <Tooltip title={showTema ? 'Ocultar tema en preguntas' : 'Mostrar tema en preguntas'}>
        <span>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={onToggleTema}
          >
            {showTema ? '🙈 Ocultar tema' : '👁️ Mostrar tema'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Finalizar el test y ver resultados">
        <span>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={onSurrender}
            disabled={surrendering}
          >
            {surrendering ? 'Finalizando...' : '🏳️ Rendirse'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Eliminar este test en curso">
        <span>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : '🗑️ Eliminar Test'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Descargar test como PDF">
        <span>
          <Button
            variant="outlined"
            color="info"
            size="small"
            onClick={onExportPDF}
            disabled={exportingPDF}
            startIcon={exportingPDF ? <CircularProgress size={18} /> : <PictureAsPdfIcon />}
          >
            {exportingPDF ? 'Exportando...' : '📄 Exportar PDF'}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};
