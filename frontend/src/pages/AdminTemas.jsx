import React, { useState, useEffect } from 'react';
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
    setExpandedTemas((prev) => ({
      ...prev,
      [temaId]: !prev[temaId],
    }));
    if (!prev[temaId]) {
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
                        label={`${preguntas.length} preguntas`}
                        size="small"
                        color={preguntas.length > 0 ? 'primary' : 'default'}
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
                                          label={pregunta.dificultad}
                                          size="small"
                                          color={
                                            pregunta.dificultad === 'EASY'
                                              ? 'success'
                                              : pregunta.dificultad === 'MEDIUM'
                                              ? 'warning'
                                              : 'error'
                                          }
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
    </Container>
  );
};
