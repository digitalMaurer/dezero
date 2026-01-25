import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slider,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Radio,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';

const scoreLabel = (score) => `${Math.round((score || 0) * 100)}%`;

export const AdminPreguntasDuplicates = ({
  temasParaFiltro = [],
  duplicateTemaFilter,
  setDuplicateTemaFilter,
  duplicateCandidates = [],
  reloadCandidates,
  duplicateBaseId,
  setDuplicateBaseId,
  duplicateThreshold,
  setDuplicateThreshold,
  duplicateLimit,
  setDuplicateLimit,
  duplicateBasePregunta,
  duplicateSimilar = [],
  duplicateLoading,
  handleFetchSimilar,
  handleMarkFalsePositive,
  mergeSelection = [],
  setMergeSelection,
  mergeMasterId,
  setMergeMasterId,
  handleMerge,
}) => {
  const handleToggleMerge = (id) => {
    if (id === mergeMasterId) return;
    setMergeSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id && x !== mergeMasterId) : [...prev, id]
    );
  };

  const handleSetMaster = (id) => {
    setMergeMasterId(id);
    // Prevent master from being in the duplicates list
    setMergeSelection((prev) => prev.filter((x) => x !== id));
  };

  const handleFalsePositive = async (otherId) => {
    if (!duplicateBaseId || !otherId) return;
    await handleMarkFalsePositive(otherId);
  };

  const mergeDisabled = !mergeMasterId || mergeSelection.length === 0 || duplicateLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Buscar posibles duplicados
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Tema</InputLabel>
            <Select
              value={duplicateTemaFilter}
              label="Tema"
              onChange={(e) => setDuplicateTemaFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {temasParaFiltro.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            select
            label="Pregunta base"
            value={duplicateBaseId}
            onChange={(e) => setDuplicateBaseId(e.target.value)}
            sx={{ minWidth: 320 }}
            helperText="Escoge la pregunta sobre la que se compararán duplicados"
          >
            <MenuItem value="">
              Selecciona una pregunta
            </MenuItem>
            {duplicateCandidates.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.id} - {p.enunciado?.slice(0, 60) || 'Sin enunciado'}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ width: 220 }}>
            <Typography variant="caption" color="textSecondary">
              Umbral de similitud ({scoreLabel(duplicateThreshold)})
            </Typography>
            <Slider
              value={duplicateThreshold}
              step={0.05}
              min={0.2}
              max={0.9}
              onChange={(_, val) => setDuplicateThreshold(Number(val))}
            />
          </Box>

          <TextField
            type="number"
            label="Límite"
            value={duplicateLimit}
            onChange={(e) => setDuplicateLimit(Number(e.target.value) || 10)}
            sx={{ width: 120 }}
            inputProps={{ min: 5, max: 100 }}
          />

          <Button variant="outlined" onClick={reloadCandidates} disabled={duplicateLoading}>
            Refrescar lista
          </Button>

          <Button
            variant="contained"
            onClick={handleFetchSimilar}
            disabled={!duplicateBaseId || duplicateLoading}
          >
            Buscar duplicados
          </Button>
        </Box>
      </Paper>

      {duplicateLoading && <LinearProgress />}

      {duplicateBasePregunta && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pregunta base ({duplicateBasePregunta.id})
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {duplicateBasePregunta.enunciado}
          </Typography>
          <Button
            sx={{ mt: 1 }}
            size="small"
            variant="text"
            onClick={() => setMergeMasterId(duplicateBasePregunta.id)}
          >
            Usar base como maestra
          </Button>
        </Paper>
      )}

      {duplicateSimilar.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Resultados similares</Typography>
            <Button
              variant="contained"
              color="secondary"
              disabled={mergeDisabled}
              onClick={handleMerge}
            >
              Unificar seleccionadas
            </Button>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Selecciona las preguntas a unificar y elige cuál será la maestra que conservará el contenido.
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Maestra</TableCell>
                <TableCell>Unificar</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Enunciado</TableCell>
                <TableCell>Tema</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {duplicateSimilar.map((item) => (
                <TableRow key={item.pregunta.id} hover>
                  <TableCell padding="checkbox">
                    <Radio
                      checked={mergeMasterId === item.pregunta.id}
                      onChange={() => handleSetMaster(item.pregunta.id)}
                    />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={mergeSelection.includes(item.pregunta.id)}
                      onChange={() => handleToggleMerge(item.pregunta.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={scoreLabel(item.score)} color={item.score > 0.7 ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.pregunta.enunciado || ''}>
                      <span>{item.pregunta.enunciado?.slice(0, 110) || 'Sin enunciado'}...</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{item.pregunta.tema?.nombre || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleSetMaster(item.pregunta.id)}>
                      Hacer maestra
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => handleFalsePositive(item.pregunta.id)}
                    >
                      No es duplicada
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {!duplicateLoading && duplicateSimilar.length === 0 && duplicateBasePregunta && (
        <Paper sx={{ p: 2 }}>
          <Typography>No se encontraron coincidencias con el umbral seleccionado.</Typography>
        </Paper>
      )}
    </Box>
  );
};
