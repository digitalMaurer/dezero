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
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { oposicionesService, temasService, preguntasService } from '../services/apiServices';

export const AdminPreguntas = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para importación
  const [importText, setImportText] = useState('');
  const [selectedOposicion, setSelectedOposicion] = useState('');
  const [selectedTema, setSelectedTema] = useState('');

  // Listas
  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);

  // Diálogos
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);

  useEffect(() => {
    loadOposiciones();
    loadPreguntas();
  }, []);

  useEffect(() => {
    if (selectedOposicion) {
      loadTemas(selectedOposicion);
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

  const loadPreguntas = async () => {
    try {
      const response = await preguntasService.getAll();
      // Backend devuelve { success: true, data: { preguntas: [...], pagination: {...} } }
      const data = response.data?.preguntas || response.preguntas || [];
      setPreguntas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar preguntas');
    }
  };

  const parseImportText = (text) => {
    const lines = text.trim().split('\n');
    const preguntas = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length !== 9) {
        throw new Error(`Línea ${index + 1}: Debe tener exactamente 9 campos separados por |`);
      }

      preguntas.push({
        id: parts[0].trim(),
        enunciado: parts[1].trim(),
        opcionA: parts[2].trim(),
        opcionB: parts[3].trim(),
        opcionC: parts[4].trim(),
        opcionD: parts[5].trim(),
        respuestacorrecta: parts[6].trim().toUpperCase(),
        explicacion: parts[7].trim() || '',
        tip: parts[8].trim() || '',
      });
    });

    return preguntas;
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Por favor, pega las preguntas');
      return;
    }

    if (!selectedOposicion) {
      setError('Selecciona una oposición');
      return;
    }

    if (!selectedTema || selectedTema === '') {
      setError('Selecciona un tema');
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
            dificultad: 'MEDIUM', // Por defecto
            status: 'PUBLISHED',
            temaId: selectedTema,
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
      setTimeout(() => setSuccess(null), 5000);
      loadPreguntas();
    } catch (err) {
      setError(`Error al importar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (preguntaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        await preguntasService.delete(preguntaId);
        setSuccess('Pregunta eliminada');
        loadPreguntas();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar la pregunta');
      }
    }
  };

  const handleEditOpen = (pregunta) => {
    setEditingPregunta({ ...pregunta });
    setOpenEditDialog(true);
  };

  const handleEditSave = async () => {
    try {
      await preguntasService.update(editingPregunta.id, editingPregunta);
      setSuccess('Pregunta actualizada');
      setOpenEditDialog(false);
      loadPreguntas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al actualizar la pregunta');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          🎓 Gestión de Preguntas
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

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="📥 Importar Preguntas" />
            <Tab label="📋 Gestionar Preguntas" />
          </Tabs>
        </Box>

        {/* Tab 1: Importar */}
        {tabValue === 0 && (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Importar Preguntas (Formato Texto)
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Formato: <code>ID|enunciado|opcionA|opcionB|opcionC|opcionD|respuesta|explicacion|tip</code>
              </Typography>
              <Alert severity="info">
                La respuesta correcta debe ser: A, B, C o D
              </Alert>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Oposición</InputLabel>
                <Select
                  value={selectedOposicion}
                  onChange={(e) => {
                    setSelectedOposicion(e.target.value);
                    setSelectedTema('');
                  }}
                  label="Oposición"
                >
                  {oposiciones.map((op) => (
                    <MenuItem key={op.id} value={op.id}>
                      {op.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!selectedOposicion}>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={selectedTema}
                  onChange={(e) => setSelectedTema(e.target.value)}
                  label="Tema"
                >
                  {temas.map((tema) => (
                    <MenuItem key={tema.id} value={tema.id}>
                      {tema.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={10}
              placeholder={`Ejemplo:\n1|¿Cuál es la capital de España?|Madrid|Barcelona|Valencia|Sevilla|A|Madrid es la capital|Pista útil\n2|¿Cuánto es 2+2?|3|4|5|6|B|||`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? 'Importando...' : 'Importar Preguntas'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setImportText('')}
              >
                Limpiar
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tab 2: Gestionar */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Total: {preguntas.length} preguntas
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Enunciado</TableCell>
                      <TableCell>Tema</TableCell>
                      <TableCell>Dificultad</TableCell>
                      <TableCell>Respuesta</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preguntas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.enunciado.substring(0, 50)}...</TableCell>
                        <TableCell>{p.tema?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.dificultad}
                            size="small"
                            color={
                              p.dificultad === 'EASY'
                                ? 'success'
                                : p.dificultad === 'MEDIUM'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{p.respuestacorrecta}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditOpen(p)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(p.id)}
                          >
                            Borrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Box>

      {/* Dialog para editar */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Pregunta</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingPregunta && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Enunciado"
                fullWidth
                multiline
                rows={3}
                value={editingPregunta.enunciado}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, enunciado: e.target.value })
                }
              />
              <TextField
                label="Opción A"
                fullWidth
                value={editingPregunta.opcionA}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, opcionA: e.target.value })
                }
              />
              <TextField
                label="Opción B"
                fullWidth
                value={editingPregunta.opcionB}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, opcionB: e.target.value })
                }
              />
              <TextField
                label="Opción C"
                fullWidth
                value={editingPregunta.opcionC}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, opcionC: e.target.value })
                }
              />
              <TextField
                label="Opción D"
                fullWidth
                value={editingPregunta.opcionD}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, opcionD: e.target.value })
                }
              />
              <FormControl fullWidth>
                <InputLabel>Respuesta Correcta</InputLabel>
                <Select
                  value={editingPregunta.respuestacorrecta}
                  onChange={(e) =>
                    setEditingPregunta({
                      ...editingPregunta,
                      respuestacorrecta: e.target.value,
                    })
                  }
                  label="Respuesta Correcta"
                >
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Explicación"
                fullWidth
                multiline
                rows={2}
                value={editingPregunta.explicacion || ''}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, explicacion: e.target.value })
                }
              />
              <TextField
                label="Tip"
                fullWidth
                value={editingPregunta.tip || ''}
                onChange={(e) =>
                  setEditingPregunta({ ...editingPregunta, tip: e.target.value })
                }
              />
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={editingPregunta.dificultad || 'MEDIUM'}
                  onChange={(e) =>
                    setEditingPregunta({ ...editingPregunta, dificultad: e.target.value })
                  }
                  label="Dificultad"
                >
                  <MenuItem value="EASY">Fácil</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="HARD">Difícil</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
