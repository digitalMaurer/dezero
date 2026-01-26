import React, { useState, useEffect } from 'react';
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
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MergeIcon from '@mui/icons-material/CallMerge';
import ClearIcon from '@mui/icons-material/Clear';

const scoreLabel = (score) => `${Math.round((score || 0) * 100)}%`;

const DuplicateGroupDialog = ({ open, group, onClose, onMerge, onMarkFalsePositive }) => {
  const [selectedDuplicates, setSelectedDuplicates] = React.useState([]);
  const [masterCandidate, setMasterCandidate] = React.useState(group?.base?.id || '');

  // Resetear estado cuando se abre con un nuevo grupo
  React.useEffect(() => {
    if (open && group) {
      setSelectedDuplicates([]);
      setMasterCandidate(group.base?.id || '');
    }
  }, [open, group?.base?.id]);

  const handleToggleDuplicate = (id) => {
    setSelectedDuplicates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMerge = () => {
    if (!masterCandidate || selectedDuplicates.length === 0) return;
    const duplicates = selectedDuplicates.filter((id) => id !== masterCandidate);
    if (duplicates.length === 0) return;
    onMerge(masterCandidate, duplicates);
    onClose();
  };

  const handleMarkAllFalsePositive = () => {
    const similarIds = group.similar.map((s) => s.pregunta?.id).filter(Boolean);
    onMarkFalsePositive(group.base?.id, similarIds);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Preguntas similares a ID {group.base?.id}</Typography>
        <Typography variant="body2" color="text.secondary">
          {group.base?.tema?.nombre || 'Sin tema'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Selecciona las preguntas que son duplicados y elige cuál debe ser la pregunta maestra.
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell padding="checkbox">Duplicado</TableCell>
              <TableCell padding="checkbox">Maestra</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>ID · Tema</TableCell>
              <TableCell>Enunciado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ backgroundColor: '#f0f8ff' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedDuplicates.includes(group.base?.id)}
                  onChange={() => handleToggleDuplicate(group.base?.id)}
                />
              </TableCell>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={masterCandidate === group.base?.id}
                  onChange={() => setMasterCandidate(group.base?.id)}
                />
              </TableCell>
              <TableCell>
                <Chip label="BASE" color="info" size="small" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {group.base?.id} · {group.base?.tema?.nombre || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title={group.base?.enunciado || ''}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 350 }}>
                    {group.base?.enunciado || 'Sin enunciado'}
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
            {group.similar.map((item) => (
              <TableRow key={item.pregunta?.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedDuplicates.includes(item.pregunta?.id)}
                    onChange={() => handleToggleDuplicate(item.pregunta?.id)}
                  />
                </TableCell>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={masterCandidate === item.pregunta?.id}
                    onChange={() => setMasterCandidate(item.pregunta?.id)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={scoreLabel(item.score)}
                    color={item.score > 0.8 ? 'error' : item.score > 0.6 ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {item.pregunta?.id} · {item.pregunta?.tema?.nombre || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={item.pregunta?.enunciado || ''}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 350 }}>
                      {item.pregunta?.enunciado || 'Sin enunciado'}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="warning"
          onClick={handleMarkAllFalsePositive}
          startIcon={<ClearIcon />}
        >
          Marcar grupo como no duplicado
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMerge}
            disabled={selectedDuplicates.length === 0 || !masterCandidate}
            startIcon={<MergeIcon />}
          >
            Unificar ({selectedDuplicates.length})
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export const AdminPreguntasDuplicates = ({
  temasParaFiltro = [],
  duplicateTemaFilter,
  setDuplicateTemaFilter,
  duplicateThreshold,
  setDuplicateThreshold,
  duplicateLimit,
  setDuplicateLimit,
  duplicateGroups = [],
  duplicateLoading,
  handleMarkFalsePositive,
  handleMergeGroup,
  handleScanDuplicates,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleOpenDialog = (group) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGroup(null);
  };

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
            disabled
            label="Pregunta base"
            value="Automática"
            sx={{ minWidth: 320 }}
            helperText="El escaneo recorre todas las preguntas del tema"
          />

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

          <Button variant="outlined" onClick={handleScanDuplicates} disabled={duplicateLoading}>
            Refrescar lista
          </Button>

          <Button variant="contained" onClick={handleScanDuplicates} disabled={duplicateLoading}>
            Buscar duplicados
          </Button>
        </Box>
      </Paper>

      {duplicateLoading && <LinearProgress />}

      {duplicateGroups.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Grupos de duplicados
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Haz clic en "Ver detalles" para revisar cada grupo, seleccionar duplicados y elegir la pregunta maestra.
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>ID</TableCell>
                <TableCell>Pregunta Base</TableCell>
                <TableCell align="center">Similares</TableCell>
                <TableCell align="center">Score Máx</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {duplicateGroups.map((group) => {
                const maxScore = Math.max(...(group.similar.map((s) => s.score) || [0]));
                return (
                  <TableRow key={`group-${group.base.id}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {group.base?.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {group.base?.tema?.nombre || 'Sin tema'}
                      </Typography>
                      <Tooltip title={group.base?.enunciado || ''}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                          {group.base?.enunciado?.slice(0, 100) || 'Sin enunciado'}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={group.similar.length} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={scoreLabel(maxScore)}
                        color={maxScore > 0.8 ? 'error' : maxScore > 0.6 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDialog(group)}
                        startIcon={<VisibilityIcon />}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {!duplicateLoading && duplicateGroups.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography>No se encontraron grupos de duplicados con el umbral seleccionado.</Typography>
        </Paper>
      )}

      <DuplicateGroupDialog
        open={dialogOpen}
        group={selectedGroup}
        onClose={handleCloseDialog}
        onMerge={handleMergeGroup}
        onMarkFalsePositive={handleMarkFalsePositive}
      />
    </Box>
  );
};
