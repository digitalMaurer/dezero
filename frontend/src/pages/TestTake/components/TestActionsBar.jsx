// TestActionsBar: muestra acciones principales del test (rendirse y eliminar en curso) con tooltips
import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';

export const TestActionsBar = ({
  onSurrender,
  onDelete,
  surrendering,
  deleting,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
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
    </Box>
  );
};
