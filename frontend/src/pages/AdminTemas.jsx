import React, { useState, useEffect } from 'react';
import { getDifficultyLabel, getDifficultyColor } from '../utils/difficulty';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Checkbox,
  Collapse,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { oposicionesService, temasService, preguntasService } from '../services/apiServices';

export const AdminTemas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selectedOposicion, setSelectedOposicion] = useState('');
  
  // Estado para expandir/colapsar temas
  const [expandedTemas, setExpandedTemas] = useState({});
  
  // Estado para preguntas de cada tema
  const [preguntasPorTema, setPreguntasPorTema] = useState({});
  
  // Estado para selección masiva de preguntas
  const [selectedPreguntasPerTema, setSelectedPreguntasPerTema] = useState({});

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    oposicionId: '',
  });
  
  // Dialog para mover preguntas
  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [targetTemaId, setTargetTemaId] = useState('');
  const [selectedTemaForMove, setSelectedTemaForMove] = useState(null);
  
  // Dialog para importar CSV
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importTemaId, setImportTemaId] = useState(null);
  const [importText, setImportText] = useState('');
  const [importDificultad, setImportDificultad] = useState('MEDIUM');

  // Dialog para cambiar dificultad masiva
  const [openChangeDiffDialog, setOpenChangeDiffDialog] = useState(false);
  const [selectedTemaForChange, setSelectedTemaForChange] = useState(null);
  const [newDificultad, setNewDificultad] = useState('MEDIUM');

  // Dialog para mover tema a otra oposición
  const [openMoveTemaDialog, setOpenMoveTemaDialog] = useState(false);
  const [selectedTemaForMoveOp, setSelectedTemaForMoveOp] = useState(null);
  const [targetOposicionId, setTargetOposicionId] = useState('');

  // Dialog para copiar tema a otra oposición
  const [openCopyTemaDialog, setOpenCopyTemaDialog] = useState(false);
  const [selectedTemaForCopy, setSelectedTemaForCopy] = useState(null);

  useEffect(() => {
    loadOposiciones();
  }, []);

  useEffect(() => {
    if (selectedOposicion) {
      loadTemas(selectedOposicion);
    } else {
      setTemas([]);
    }
  }, [selectedOposicion]);

  const loadOposiciones = async () => {
    try {
      const response = await oposicionesService.getAll();
      // Backend devuelve { success: true, data: { oposiciones: [...] } }
      const data = response.data?.oposiciones || response.oposiciones || [];
      setOposiciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar oposiciones');
    }
  };

  const loadTemas = async (oposicionId) => {
    try {
      const response = await temasService.getAll(oposicionId);
      // Backend devuelve { success: true, data: { temas: [...] } }
      const data = response.data?.temas || response.temas || [];
      setTemas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar temas');
    }
  };

  const handleOpenDialog = (tema = null) => {
    if (tema) {
      setEditingTema(tema);
      setFormData({
        nombre: tema.nombre,
        descripcion: tema.descripcion || '',
        oposicionId: selectedOposicion,
      });
    } else {
      setEditingTema(null);
      setFormData({
        nombre: '',
        descripcion: '',
        oposicionId: selectedOposicion,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del tema es requerido');
      return;
    }

    if (!selectedOposicion) {
      setError('Selecciona una oposición');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingTema) {
        await temasService.update(editingTema.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });
        setSuccess('Tema actualizado');
      } else {
        await temasService.create({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          oposicionId: selectedOposicion,
        });
        setSuccess('Tema creado');
      }

      setOpenDialog(false);
      loadTemas(selectedOposicion);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar tema');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (temaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tema?')) {
      try {
        await temasService.delete(temaId);
        setSuccess('Tema eliminado');
        loadTemas(selectedOposicion);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar tema');
      }
    }
  };

  // Cargar preguntas de un tema
  const loadPreguntasByTema = async (temaId) => {
    if (preguntasPorTema[temaId]) return; // Ya cargadas

    try {
      const response = await preguntasService.getAll({ temaId, limit: 1000 });
      const preguntas = response.data?.preguntas || [];
      setPreguntasPorTema((prev) => ({ ...prev, [temaId]: preguntas }));
    } catch (err) {
      console.error(`Error cargando preguntas del tema ${temaId}:`, err);
    }
  };

  // Expandir/colapsar tema
  const toggleTemaExpand = (temaId) => {
    const wasExpanded = expandedTemas[temaId];
    setExpandedTemas((prev) => ({
      ...prev,
      [temaId]: !prev[temaId],
    }));
    if (!wasExpanded) {
      loadPreguntasByTema(temaId);
    }
  };

  // Seleccionar/deseleccionar pregunta
  const toggleSelectPregunta = (temaId, preguntaId) => {
    setSelectedPreguntasPerTema((prev) => {
      const temaPreguntas = prev[temaId] || [];
      return {
        ...prev,
        [temaId]: temaPreguntas.includes(preguntaId)
          ? temaPreguntas.filter((id) => id !== preguntaId)
          : [...temaPreguntas, preguntaId],
      };
    });
  };

  // Seleccionar todas las preguntas de un tema
  const toggleSelectAllTema = (temaId) => {
    const preguntas = preguntasPorTema[temaId] || [];
    const selected = selectedPreguntasPerTema[temaId] || [];
    
    if (selected.length === preguntas.length) {
      setSelectedPreguntasPerTema((prev) => ({ ...prev, [temaId]: [] }));
    } else {
      setSelectedPreguntasPerTema((prev) => ({
        ...prev,
        [temaId]: preguntas.map((p) => p.id),
      }));
    }
  };

  // Borrar preguntas seleccionadas
  const handleDeletePreguntas = async (temaId) => {
    const selected = selectedPreguntasPerTema[temaId] || [];
    if (selected.length === 0) {
      setError('Selecciona al menos una pregunta');
      return;
    }

    if (!window.confirm(`¿Borrar ${selected.length} pregunta(s)?`)) return;

    try {
      setLoading(true);
      for (const preguntaId of selected) {
        await preguntasService.delete(preguntaId);
      }
      setSuccess(`${selected.length} pregunta(s) eliminada(s)`);
      setSelectedPreguntasPerTema((prev) => ({ ...prev, [temaId]: [] }));
      await loadPreguntasByTema(temaId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al borrar preguntas');
    } finally {
      setLoading(false);
    }
  };

  // Mover preguntas a otro tema
  const handleMovePreguntas = async (temaId) => {
    const selected = selectedPreguntasPerTema[temaId] || [];
    if (selected.length === 0) {
      setError('Selecciona al menos una pregunta');
      return;
    }
    
    setSelectedTemaForMove(temaId);
    setOpenMoveDialog(true);
  };

  const confirmMovePreguntas = async () => {
    if (!targetTemaId) {
      setError('Selecciona el tema destino');
      return;
    }

    const selected = selectedPreguntasPerTema[selectedTemaForMove] || [];

    try {
      setLoading(true);
      for (const preguntaId of selected) {
        await preguntasService.update(preguntaId, { temaId: targetTemaId });
      }
      setSuccess(`${selected.length} pregunta(s) movida(s)`);
      setSelectedPreguntasPerTema((prev) => ({ ...prev, [selectedTemaForMove]: [] }));
      setPreguntasPorTema((prev) => ({ ...prev, [selectedTemaForMove]: [] }));
      setOpenMoveDialog(false);
      setTargetTemaId('');
      await loadPreguntasByTema(selectedTemaForMove);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al mover preguntas');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar dificultad de preguntas seleccionadas
  const handleChangeDifficulty = (temaId) => {
    const selected = selectedPreguntasPerTema[temaId] || [];
    if (selected.length === 0) {
      setError('Selecciona al menos una pregunta');
      return;
    }
    setSelectedTemaForChange(temaId);
    setNewDificultad('MEDIUM');
    setOpenChangeDiffDialog(true);
  };

  const confirmChangeDifficulty = async () => {
    const temaId = selectedTemaForChange;
    const selected = selectedPreguntasPerTema[temaId] || [];
    if (!temaId || selected.length === 0) {
      setOpenChangeDiffDialog(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      for (const preguntaId of selected) {
        await preguntasService.update(preguntaId, { dificultad: newDificultad });
      }
      setSuccess(`${selected.length} pregunta(s) actualizada(s) a ${getDifficultyLabel(newDificultad)}`);
      setSelectedPreguntasPerTema((prev) => ({ ...prev, [temaId]: [] }));
      setPreguntasPorTema((prev) => ({ ...prev, [temaId]: [] }));
      setOpenChangeDiffDialog(false);
      await loadPreguntasByTema(temaId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al cambiar dificultad');
    } finally {
      setLoading(false);
    }
  };

  // Mover tema a otra oposición
  const handleMoveTemaToOposicion = (tema) => {
    setSelectedTemaForMoveOp(tema);
    setTargetOposicionId('');
    setOpenMoveTemaDialog(true);
  };

  const confirmMoveTema = async () => {
    if (!targetOposicionId || !selectedTemaForMoveOp) {
      setError('Selecciona la oposición destino');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await temasService.update(selectedTemaForMoveOp.id, { oposicionId: targetOposicionId });
      setSuccess(`Tema "${selectedTemaForMoveOp.nombre}" movido a otra oposición`);
      setOpenMoveTemaDialog(false);
      setTargetOposicionId('');
      setSelectedTemaForMoveOp(null);
      await loadTemas(selectedOposicion);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al mover tema');
    } finally {
      setLoading(false);
    }
  };

  // Copiar tema a otra oposición
  const handleCopyTemaToOposicion = (tema) => {
    setSelectedTemaForCopy(tema);
    setTargetOposicionId('');
    setOpenCopyTemaDialog(true);
  };

  const confirmCopyTema = async () => {
    if (!targetOposicionId || !selectedTemaForCopy) {
      setError('Selecciona la oposición destino');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await temasService.copy(selectedTemaForCopy.id, targetOposicionId);
      setSuccess(response.message || `Tema "${selectedTemaForCopy.nombre}" copiado`);
      setOpenCopyTemaDialog(false);
      setTargetOposicionId('');
      setSelectedTemaForCopy(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al copiar tema');
    } finally {
      setLoading(false);
    }
  };

  // Importar CSV
  const parseImportText = (text) => {
    const lines = text.trim().split('\n');
    const preguntas = [];

    lines.forEach((line) => {
      const parts = line.split('|');
      if (parts.length < 7) return;

      preguntas.push({
        id: parts[0].trim(),
        enunciado: parts[1].trim(),
        opcionA: parts[2].trim(),
        opcionB: parts[3].trim(),
        opcionC: parts[4].trim(),
        opcionD: parts[5].trim(),
        respuestacorrecta: parts[6].trim().toUpperCase(),
        explicacion: parts[7]?.trim() || '',
        tip: parts[8]?.trim() || '',
      });
    });

    return preguntas;
  };

  const handleImportCSV = async () => {
    if (!importText.trim()) {
      setError('Por favor, pega las preguntas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const preguntasParsed = parseImportText(importText);

      // Validar respuestas correctas
      preguntasParsed.forEach((p, idx) => {
        if (!['A', 'B', 'C', 'D'].includes(p.respuestacorrecta)) {
          throw new Error(
            `Pregunta ${idx + 1}: La respuesta correcta debe ser A, B, C o D`
          );
        }
      });

      // Importar cada pregunta
      let importadas = 0;
      for (const p of preguntasParsed) {
        try {
          await preguntasService.create({
            titulo: `Pregunta ${p.id}`,
            enunciado: p.enunciado,
            opcionA: p.opcionA,
            opcionB: p.opcionB,
            opcionC: p.opcionC,
            opcionD: p.opcionD,
            respuestaCorrecta: p.respuestacorrecta,
            explicacion: p.explicacion,
            tip: p.tip,
            dificultad: importDificultad,
            status: 'PUBLISHED',
            temaId: importTemaId,
          });
          importadas++;
        } catch (err) {
          console.error(`Error al importar pregunta ${p.id}:`, err);
        }
      }

      setSuccess(
        `✅ ${importadas} de ${preguntasParsed.length} preguntas importadas correctamente`
      );
      setImportText('');
      setOpenImportDialog(false);
      setPreguntasPorTema((prev) => ({ ...prev, [importTemaId]: [] }));
      await loadPreguntasByTema(importTemaId);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Error al importar preguntas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          📚 Gestión de Temas
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Seleccionar Oposición */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Selecciona una Oposición</InputLabel>
            <Select
              value={selectedOposicion}
              onChange={(e) => setSelectedOposicion(e.target.value)}
              label="Selecciona una Oposición"
            >
              {oposiciones.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Botón Nuevo Tema */}
        {selectedOposicion && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mb: 3 }}
          >
            Nuevo Tema
          </Button>
        )}

        {/* Tabla de Temas */}
        {selectedOposicion && (
          <Box>
            {temas.length === 0 ? (
              <Alert severity="info">No hay temas para esta oposición</Alert>
            ) : (
              temas.map((tema) => {
                const preguntas = preguntasPorTema[tema.id] || [];
                const totalPreguntas = preguntas.length > 0
                  ? preguntas.length
                  : tema._count?.preguntas ?? 0;
                const selected = selectedPreguntasPerTema[tema.id] || [];
                const isExpanded = expandedTemas[tema.id];

                return (
                  <Paper key={tema.id} sx={{ mb: 2, overflow: 'hidden' }}>
                    {/* Header del Tema */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderBottom: isExpanded ? '1px solid #ddd' : 'none',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => toggleTemaExpand(tema.id)}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {tema.nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {tema.descripcion || 'Sin descripción'}
                        </Typography>
                      </Box>

                      <Chip
                        label={`${totalPreguntas} preguntas`}
                        size="small"
                        color={totalPreguntas > 0 ? 'primary' : 'default'}
                        sx={{ mr: 2 }}
                      />

                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(tema)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="secondary"
                        startIcon={<DriveFileMoveIcon />}
                        onClick={() => handleMoveTemaToOposicion(tema)}
                      >
                        Mover
                      </Button>
                      <Button
                        size="small"
                        color="info"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleCopyTemaToOposicion(tema)}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(tema.id)}
                      >
                        Borrar
                      </Button>
                    </Box>

                    {/* Preguntas del Tema (Expandible) */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2 }}>
                        {/* Botón Importar CSV */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => {
                              setImportTemaId(tema.id);
                              setOpenImportDialog(true);
                            }}
                          >
                            Importar CSV
                          </Button>
                        </Stack>

                        {preguntas.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">
                            No hay preguntas en este tema
                          </Typography>
                        ) : (
                          <>
                            {/* Botones de acciones masivas */}
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => toggleSelectAllTema(tema.id)}
                              >
                                {selected.length === preguntas.length
                                  ? 'Deseleccionar todo'
                                  : 'Seleccionar todo'}
                              </Button>
                              {selected.length > 0 && (
                                <>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDeletePreguntas(tema.id)}
                                  >
                                    Borrar ({selected.length})
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleMovePreguntas(tema.id)}
                                  >
                                    Mover ({selected.length})
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleChangeDifficulty(tema.id)}
                                  >
                                    Cambiar dificultad ({selected.length})
                                  </Button>
                                </>
                              )}
                            </Stack>

                            {/* Tabla de preguntas */}
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: '#eeeeee' }}>
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={
                                          selected.length > 0 &&
                                          selected.length === preguntas.length
                                        }
                                        onChange={() => toggleSelectAllTema(tema.id)}
                                      />
                                    </TableCell>
                                    <TableCell>Enunciado</TableCell>
                                    <TableCell align="center">Dificultad</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {preguntas.map((pregunta) => (
                                    <TableRow
                                      key={pregunta.id}
                                      hover
                                      selected={selected.includes(pregunta.id)}
                                    >
                                      <TableCell padding="checkbox">
                                        <Checkbox
                                          checked={selected.includes(pregunta.id)}
                                          onChange={() =>
                                            toggleSelectPregunta(tema.id, pregunta.id)
                                          }
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {pregunta.enunciado.substring(0, 60)}...
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={getDifficultyLabel(pregunta.dificultad)}
                                          size="small"
                                          color={getDifficultyColor(pregunta.dificultad)}
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Button
                                          size="small"
                                          color="error"
                                          onClick={() =>
                                            preguntasService
                                              .delete(pregunta.id)
                                              .then(() => {
                                                setSuccess(
                                                  'Pregunta eliminada'
                                                );
                                                loadPreguntasByTema(tema.id);
                                              })
                                              .catch(() => {
                                                setError(
                                                  'Error al eliminar pregunta'
                                                );
                                              })
                                          }
                                        >
                                          Borrar
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })
            )}
          </Box>
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTema ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            label="Nombre del Tema"
            fullWidth
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cambiar Dificultad */}
      <Dialog open={openChangeDiffDialog} onClose={() => setOpenChangeDiffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar dificultad de preguntas seleccionadas</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Nueva Dificultad</InputLabel>
            <Select
              value={newDificultad}
              onChange={(e) => setNewDificultad(e.target.value)}
              label="Nueva Dificultad"
            >
              <MenuItem value="EASY">Fácil</MenuItem>
              <MenuItem value="MEDIUM">Media</MenuItem>
              <MenuItem value="HARD">Difícil</MenuItem>
              <MenuItem value="ULTRAHARD">Muy Difícil</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChangeDiffDialog(false)}>Cancelar</Button>
          <Button onClick={confirmChangeDifficulty} variant="contained" disabled={loading}>
            {loading ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Mover Preguntas */}
      <Dialog open={openMoveDialog} onClose={() => setOpenMoveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mover Preguntas a Otro Tema</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Tema Destino</InputLabel>
            <Select
              value={targetTemaId}
              onChange={(e) => setTargetTemaId(e.target.value)}
              label="Tema Destino"
            >
              {temas.map((tema) => (
                <MenuItem key={tema.id} value={tema.id} disabled={tema.id === selectedTemaForMove}>
                  {tema.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMoveDialog(false)}>Cancelar</Button>
          <Button onClick={confirmMovePreguntas} variant="contained" disabled={loading}>
            {loading ? 'Moviendo...' : 'Mover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Importar CSV */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importar Preguntas desde CSV</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Formato: ID|Enunciado|OpciónA|OpciónB|OpciónC|OpciónD|Respuesta|Explicación|Tip
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Dificultad de todas las preguntas</InputLabel>
            <Select
              value={importDificultad}
              onChange={(e) => setImportDificultad(e.target.value)}
              label="Dificultad de todas las preguntas"
            >
              <MenuItem value="EASY">Fácil</MenuItem>
              <MenuItem value="MEDIUM">Media</MenuItem>
              <MenuItem value="HARD">Difícil</MenuItem>
              <MenuItem value="ULTRAHARD">Muy Difícil</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={10}
            placeholder="Ejemplo:
1|¿Cuál es la capital de España?|Madrid|Barcelona|Valencia|Sevilla|A|Madrid es la capital|Pista útil
2|¿Cuánto es 2+2?|3|4|5|6|B|||"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Cancelar</Button>
          <Button onClick={() => setImportText('')} disabled={loading}>
            Limpiar
          </Button>
          <Button onClick={handleImportCSV} variant="contained" disabled={loading}>
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Mover Tema a Otra Oposición */}
      <Dialog open={openMoveTemaDialog} onClose={() => setOpenMoveTemaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mover Tema a Otra Oposición</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tema: <strong>{selectedTemaForMoveOp?.nombre}</strong>
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Oposición Destino</InputLabel>
            <Select
              value={targetOposicionId}
              onChange={(e) => setTargetOposicionId(e.target.value)}
              label="Oposición Destino"
            >
              {oposiciones
                .filter((op) => op.id !== selectedOposicion)
                .map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.nombre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMoveTemaDialog(false)}>Cancelar</Button>
          <Button onClick={confirmMoveTema} variant="contained" disabled={loading}>
            {loading ? 'Moviendo...' : 'Mover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Copiar Tema a Otra Oposición */}
      <Dialog open={openCopyTemaDialog} onClose={() => setOpenCopyTemaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Copiar Tema a Otra Oposición</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Se copiará el tema <strong>{selectedTemaForCopy?.nombre}</strong> con todas sus preguntas.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Oposición Destino</InputLabel>
            <Select
              value={targetOposicionId}
              onChange={(e) => setTargetOposicionId(e.target.value)}
              label="Oposición Destino"
            >
              {oposiciones.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCopyTemaDialog(false)}>Cancelar</Button>
          <Button onClick={confirmCopyTema} variant="contained" disabled={loading}>
            {loading ? 'Copiando...' : 'Copiar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
