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
  Checkbox,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { oposicionesService, temasService, preguntasService, reportsService } from '../services/apiServices';

export const AdminPreguntas = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para importación
  const [importText, setImportText] = useState('');
  const [selectedOposicion, setSelectedOposicion] = useState('');
  const [selectedTema, setSelectedTema] = useState('');

  // Estados para importación con imagen
  const [selectedOposicionImage, setSelectedOposicionImage] = useState('');
  const [selectedTemaImage, setSelectedTemaImage] = useState('');
  const [temasImagen, setTemasImagen] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageForm, setImageForm] = useState({
    titulo: '',
    enunciado: '',
    opcionA: '',
    opcionB: '',
    opcionC: '',
    opcionD: '',
    respuestaCorrecta: 'A',
    explicacion: '',
    tip: '',
    dificultad: 'MEDIUM',
  });

  // Listas
  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [reports, setReports] = useState([]);

  // Selección y cambio masivo
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetOposicion, setTargetOposicion] = useState('');
  const [targetTema, setTargetTema] = useState('');
  const [targetTemas, setTargetTemas] = useState([]);

  // Diálogos
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);
  const [openViewReportDialog, setOpenViewReportDialog] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  
  // Temas para selector de edición
  const [temasEdicion, setTemasEdicion] = useState([]);

  useEffect(() => {
    loadOposiciones();
    loadPreguntas();
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedOposicion) {
      loadTemas(selectedOposicion);
    }
  }, [selectedOposicion]);

  useEffect(() => {
    if (selectedOposicionImage) {
      loadTemasImagen(selectedOposicionImage);
    } else {
      setTemasImagen([]);
      setSelectedTemaImage('');
    }
  }, [selectedOposicionImage]);

  useEffect(() => {
    const loadTargetTemas = async () => {
      if (!targetOposicion) {
        setTargetTemas([]);
        setTargetTema('');
        return;
      }
      try {
        const response = await temasService.getAll(targetOposicion);
        const data = response.data?.temas || response.temas || [];
        setTargetTemas(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setTargetTemas([]);
      }
    };
    loadTargetTemas();
  }, [targetOposicion]);

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedIds(preguntas.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkMove = async () => {
    if (selectedIds.length === 0) {
      setError('Selecciona al menos una pregunta');
      return;
    }
    if (!targetTema) {
      setError('Selecciona el tema destino');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await preguntasService.bulkUpdateTema(selectedIds, targetTema);
      setSuccess(`Preguntas actualizadas: ${selectedIds.length}`);
      setSelectedIds([]);
      setTimeout(() => setSuccess(null), 3000);
      await loadPreguntas();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al mover preguntas');
    } finally {
      setLoading(false);
    }
  };

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

  const loadTemasImagen = async (oposicionId) => {
    try {
      const response = await temasService.getAll(oposicionId);
      const data = response.data?.temas || response.temas || [];
      setTemasImagen(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTemasImagen([]);
    }
  };

  const loadPreguntas = async () => {
    try {
      const response = await preguntasService.getAll({ limit: 1000, page: 1 });
      // Backend devuelve { success: true, data: { preguntas: [...], pagination: {...} } }
      const data = response.data?.preguntas || response.preguntas || [];
      setPreguntas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar preguntas');
    }
  };

  // Cargar temas para la pregunta a editar
  const loadTemasForPregunta = async (pregunta) => {
    try {
      // Intentar obtener el oposicionId desde la pregunta cargada
      let oposicionId = pregunta?.tema?.oposicionId || pregunta?.tema?.oposicion?.id;

      // Si no viene la oposición, obtener la pregunta completa
      if (!oposicionId && pregunta?.id) {
        try {
          const detail = await preguntasService.getById(pregunta.id);
          const preguntaDetallada = detail.data?.pregunta || detail.pregunta;
          oposicionId =
            preguntaDetallada?.tema?.oposicionId || preguntaDetallada?.tema?.oposicion?.id;
          // Asegurar temaId en el estado de edición
          if (preguntaDetallada?.temaId) {
            setEditingPregunta((prev) => ({ ...(prev || {}), temaId: preguntaDetallada.temaId }));
          }
        } catch (err) {
          console.error('Error obteniendo detalle de la pregunta:', err);
        }
      }

      if (oposicionId) {
        const response = await temasService.getAll(oposicionId);
        const data = response.data?.temas || response.temas || [];
        setTemasEdicion(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando temas:', err);
    }
  };

  // Obtener pregunta completa (con todos los campos) por id
  const fetchPreguntaDetalle = async (preguntaId) => {
    if (!preguntaId) return null;
    try {
      const detail = await preguntasService.getById(preguntaId);
      const preguntaDetallada = detail.data?.pregunta || detail.pregunta || null;
      return preguntaDetallada;
    } catch (err) {
      console.error('Error obteniendo detalle de la pregunta:', err);
      return null;
    }
  };

  // Normaliza campos vacíos para evitar valores undefined en inputs controlados
  const normalizePregunta = (pregunta) => {
    if (!pregunta) return null;
    return {
      opcionA: '',
      opcionB: '',
      opcionC: '',
      opcionD: '',
      respuestaCorrecta: '',
      explicacion: '',
      tip: '',
      dificultad: 'MEDIUM',
      ...pregunta,
    };
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

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetImageForm = () => {
    setImageForm({
      titulo: '',
      enunciado: '',
      opcionA: '',
      opcionB: '',
      opcionC: '',
      opcionD: '',
      respuestaCorrecta: 'A',
      explicacion: '',
      tip: '',
      dificultad: 'MEDIUM',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreateWithImage = async () => {
    if (!selectedOposicionImage) {
      setError('Selecciona una oposición');
      return;
    }
    if (!selectedTemaImage) {
      setError('Selecciona un tema');
      return;
    }
    if (!imageFile) {
      setError('Añade una imagen');
      return;
    }
    if (!imageForm.enunciado.trim() || !imageForm.opcionA.trim() || !imageForm.opcionB.trim() || !imageForm.opcionC.trim()) {
      setError('Completa enunciado y opciones A, B y C');
      return;
    }
    if (!['A', 'B', 'C', 'D'].includes(imageForm.respuestaCorrecta)) {
      setError('Respuesta correcta debe ser A, B, C o D');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', imageFile);

      const uploadRes = await preguntasService.uploadImage(formData);
      const imageUrl = uploadRes.data?.imageUrl || uploadRes.data?.data?.imageUrl || uploadRes.imageUrl;

      if (!imageUrl) {
        throw new Error('No se pudo obtener la URL de la imagen');
      }

      await preguntasService.create({
        titulo: imageForm.titulo || 'Pregunta con imagen',
        enunciado: imageForm.enunciado,
        opcionA: imageForm.opcionA,
        opcionB: imageForm.opcionB,
        opcionC: imageForm.opcionC,
        opcionD: imageForm.opcionD,
        respuestaCorrecta: imageForm.respuestaCorrecta,
        explicacion: imageForm.explicacion,
        tip: imageForm.tip,
        dificultad: imageForm.dificultad,
        status: 'PUBLISHED',
        temaId: selectedTemaImage,
        imageUrl,
      });

      setSuccess('Pregunta con imagen creada');
      resetImageForm();
      loadPreguntas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la pregunta con imagen');
    } finally {
      setUploadingImage(false);
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

  const loadReports = async () => {
    try {
      const response = await reportsService.getAll({ estado: 'PENDIENTE', limit: 1000 });
      const data = response.data?.reports || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReports([]);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportsService.delete(reportId);
      setSuccess('Reporte eliminado');
      loadReports();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al eliminar el reporte');
    }
  };

  const handleDeleteAllReportsForQuestion = async (preguntaId) => {
    if (window.confirm('¿Eliminar todos los reportes de esta pregunta?')) {
      try {
        await reportsService.deleteByPregunta(preguntaId);
        setSuccess('Reportes eliminados');
        loadReports();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar los reportes');
      }
    }
  };

  const handleEditOpen = async (pregunta) => {
    setEditingPregunta({ ...pregunta });
    setOpenEditDialog(true);

    // Cargar temas de la oposición actual
    await loadTemasForPregunta(pregunta);
  };

  const handleEditSave = async () => {
    try {
      const payload = {
        enunciado: editingPregunta.enunciado,
        opcionA: editingPregunta.opcionA,
        opcionB: editingPregunta.opcionB,
        opcionC: editingPregunta.opcionC,
        opcionD: editingPregunta.opcionD,
        respuestaCorrecta: editingPregunta.respuestaCorrecta,
        explicacion: editingPregunta.explicacion || '',
        tip: editingPregunta.tip || '',
        dificultad: editingPregunta.dificultad || 'MEDIUM',
        temaId: editingPregunta.temaId, // Incluir tema
      };
      await preguntasService.update(editingPregunta.id, payload);
      setSuccess('Pregunta actualizada');
      setOpenEditDialog(false);
      loadPreguntas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la pregunta');
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
            <Tab label="🖼️ Importar con Imagen" />
            <Tab label="📋 Gestionar Preguntas" />
            <Tab label={`🚩 Reportes (${reports.length})`} />
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
                Formato: <code>ID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip</code>
              </Typography>
              <Alert severity="info">
                La respuesta correcta debe ser: A, B, C o D
              </Alert>
            </Box>

            {/* Prompt para generar preguntas con otra IA */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Prompt sugerido para generar preguntas con IA
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Copia este texto y pégalo en tu IA favorita. Luego pega la salida aquí.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={5}
                value={`Genera [CANTIDAD] preguntas tipo test sobre: [TEMA].\nDevuelve SOLO texto plano, una pregunta por línea, sin numeración adicional ni explicaciones.\nFormato EXACTO por línea (usa | como separador):\nID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip\nReglas:\n- ID: número correlativo (1,2,3,...)\n- respuestaCorrecta: solo A, B, C o D (en MAYÚSCULA).\n- Una línea por pregunta, sin texto extra antes o después.\nEjemplo:\n1|¿Cuál es la capital de Francia?|Madrid|París|Berlín|Roma|B|París es la capital de Francia|Usa la mnemotecnia “Ciudad de la Luz”`}
                inputProps={{ readOnly: true }}
                sx={{ fontFamily: 'monospace', mb: 1 }}
              />
              <Box>
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(
                    'Genera [CANTIDAD] preguntas tipo test sobre: [TEMA].\nDevuelve SOLO texto plano, una pregunta por línea, sin numeración adicional ni explicaciones.\nFormato EXACTO por línea (usa | como separador):\nID|enunciado|opcionA|opcionB|opcionC|opcionD|respuestaCorrecta|explicacion|tip\nReglas:\n- ID: número correlativo (1,2,3,...)\n- respuestaCorrecta: solo A, B, C o D (en MAYÚSCULA).\n- Una línea por pregunta, sin texto extra antes o después.\nEjemplo:\n1|¿Cuál es la capital de Francia?|Madrid|París|Berlín|Roma|B|París es la capital de Francia|Usa la mnemotecnia “Ciudad de la Luz”'
                  )}
                >
                  Copiar prompt
                </Button>
              </Box>
            </Paper>

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

        {/* Tab 2: Importar con Imagen */}
        {tabValue === 1 && (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Importar Pregunta con Imagen
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Oposición</InputLabel>
                <Select
                  value={selectedOposicionImage}
                  onChange={(e) => {
                    setSelectedOposicionImage(e.target.value);
                    setSelectedTemaImage('');
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

              <FormControl fullWidth disabled={!selectedOposicionImage}>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={selectedTemaImage}
                  onChange={(e) => setSelectedTemaImage(e.target.value)}
                  label="Tema"
                >
                  {temasImagen.map((tema) => (
                    <MenuItem key={tema.id} value={tema.id}>
                      {tema.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Cargar imagen */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                1. Añadir imagen
              </Typography>
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                Seleccionar imagen
                <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
              </Button>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', border: '2px solid #ccc', borderRadius: '8px' }} />
                </Box>
              )}
            </Box>

            {/* Formulario pregunta */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                2. Crear pregunta
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Título (opcional)"
                  value={imageForm.titulo}
                  onChange={(e) => setImageForm({ ...imageForm, titulo: e.target.value })}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Enunciado *"
                  value={imageForm.enunciado}
                  onChange={(e) => setImageForm({ ...imageForm, enunciado: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Opción A *"
                  value={imageForm.opcionA}
                  onChange={(e) => setImageForm({ ...imageForm, opcionA: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Opción B *"
                  value={imageForm.opcionB}
                  onChange={(e) => setImageForm({ ...imageForm, opcionB: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Opción C *"
                  value={imageForm.opcionC}
                  onChange={(e) => setImageForm({ ...imageForm, opcionC: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Opción D (opcional)"
                  value={imageForm.opcionD}
                  onChange={(e) => setImageForm({ ...imageForm, opcionD: e.target.value })}
                />

                <FormControl fullWidth>
                  <InputLabel>Respuesta Correcta *</InputLabel>
                  <Select
                    value={imageForm.respuestaCorrecta}
                    label="Respuesta Correcta *"
                    onChange={(e) => setImageForm({ ...imageForm, respuestaCorrecta: e.target.value })}
                  >
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="C">C</MenuItem>
                    <MenuItem value="D">D</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Explicación (opcional)"
                  value={imageForm.explicacion}
                  onChange={(e) => setImageForm({ ...imageForm, explicacion: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Tip (opcional)"
                  value={imageForm.tip}
                  onChange={(e) => setImageForm({ ...imageForm, tip: e.target.value })}
                />

                <FormControl fullWidth>
                  <InputLabel>Dificultad</InputLabel>
                  <Select
                    value={imageForm.dificultad}
                    label="Dificultad"
                    onChange={(e) => setImageForm({ ...imageForm, dificultad: e.target.value })}
                  >
                    <MenuItem value="EASY">Fácil</MenuItem>
                    <MenuItem value="MEDIUM">Media</MenuItem>
                    <MenuItem value="HARD">Difícil</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateWithImage}
                disabled={uploadingImage || loading}
              >
                {uploadingImage ? 'Subiendo...' : 'Crear Pregunta con Imagen'}
              </Button>
              <Button variant="outlined" onClick={resetImageForm}>
                Limpiar
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tab 3: Gestionar */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Total: {preguntas.length} preguntas
            </Typography>

            {/* Herramientas de cambio masivo */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Oposición destino</InputLabel>
                  <Select
                    value={targetOposicion}
                    label="Oposición destino"
                    onChange={(e) => {
                      setTargetOposicion(e.target.value);
                      setTargetTema('');
                    }}
                  >
                    {oposiciones.map((op) => (
                      <MenuItem key={op.id} value={op.id}>
                        {op.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 220 }} disabled={!targetOposicion}>
                  <InputLabel>Tema destino</InputLabel>
                  <Select
                    value={targetTema}
                    label="Tema destino"
                    onChange={(e) => setTargetTema(e.target.value)}
                  >
                    {targetTemas.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  disabled={selectedIds.length === 0 || !targetTema || loading}
                  onClick={handleBulkMove}
                >
                  Mover seleccionadas ({selectedIds.length})
                </Button>
              </Box>
            </Paper>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.length > 0 && selectedIds.length === preguntas.length}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < preguntas.length}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </TableCell>
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
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleOne(p.id)}
                          />
                        </TableCell>
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
                        <TableCell>{p.respuestaCorrecta}</TableCell>
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

        {/* Tab 4: Reportes */}
        {tabValue === 3 && (
          <Box>
            {reports.length === 0 ? (
              <Alert severity="info">No hay reportes pendientes</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pregunta</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tema / Oposición</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reporte</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {report.pregunta?.enunciado || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {report.pregunta?.tema?.nombre} / {report.pregunta?.tema?.oposicion?.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {report.descripcion}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{report.user?.nombre}</Typography>
                          <Typography variant="caption" color="textSecondary">{report.user?.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="info"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => {
                                setViewingReport(report);
                                setOpenViewReportDialog(true);
                              }}
                            >
                              Ver
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              Eliminar
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {/* Botón para eliminar todos los reportes de una pregunta */}
            {reports.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="warning">
                  💡 Puedes eliminar todos los reportes de una pregunta si la corriges
                </Alert>
              </Box>
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
              
              {/* Selector de Tema */}
              <FormControl fullWidth>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={editingPregunta.temaId || editingPregunta.tema?.id || ''}
                  onChange={(e) =>
                    setEditingPregunta({ ...editingPregunta, temaId: e.target.value })
                  }
                  label="Tema"
                >
                  {temasEdicion.map((tema) => (
                    <MenuItem key={tema.id} value={tema.id}>
                      {tema.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
                  value={editingPregunta.respuestaCorrecta || ''}
                  onChange={(e) =>
                    setEditingPregunta({
                      ...editingPregunta,
                      respuestaCorrecta: e.target.value,
                    })
                  }
                  label="Respuesta Correcta"
                >
                  <MenuItem value="" disabled>
                    Selecciona
                  </MenuItem>
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
          <Button
            color="error"
            variant="outlined"
            disabled={!editingPregunta?.id}
            onClick={async () => {
              if (!editingPregunta?.id) return;
              await handleDelete(editingPregunta.id);
              setOpenEditDialog(false);
            }}
          >
            Eliminar
          </Button>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para visualizar reporte */}
      <Dialog open={openViewReportDialog} onClose={() => setOpenViewReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>🚩 Detalle del Reporte</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {viewingReport && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Información del reporte */}
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ⚠️ Reporte
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Usuario:</strong> {viewingReport.user?.nombre} ({viewingReport.user?.email})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Fecha:</strong> {new Date(viewingReport.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Problema reportado:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {viewingReport.descripcion}
                </Typography>
              </Box>

              {/* Pregunta reportada */}
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  ❓ Pregunta Reportada
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Enunciado:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                  {viewingReport.pregunta?.enunciado}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción A:</Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                      {viewingReport.pregunta?.opcionA}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción B:</Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                      {viewingReport.pregunta?.opcionB}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción C:</Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                      {viewingReport.pregunta?.opcionC}
                    </Typography>
                  </Box>
                  {viewingReport.pregunta?.opcionD && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Opción D:</Typography>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                        {viewingReport.pregunta?.opcionD}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Respuesta Correcta:</strong> <Chip label={viewingReport.pregunta?.respuestaCorrecta} color="success" size="small" />
                </Typography>

                {viewingReport.pregunta?.explicacion && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Explicación:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                      {viewingReport.pregunta?.explicacion}
                    </Typography>
                  </>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={`Tema: ${viewingReport.pregunta?.tema?.nombre}`} 
                    size="small" 
                  />
                  <Chip 
                    label={`Oposición: ${viewingReport.pregunta?.tema?.oposicion?.nombre}`} 
                    size="small" 
                  />
                  <Chip 
                    label={`Dificultad: ${viewingReport.pregunta?.dificultad}`}
                    color={
                      viewingReport.pregunta?.dificultad === 'EASY'
                        ? 'success'
                        : viewingReport.pregunta?.dificultad === 'MEDIUM'
                        ? 'warning'
                        : 'error'
                    }
                    size="small" 
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenViewReportDialog(false);
              setViewingReport(null);
            }}
          >
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              // Cambiar a tab de gestionar preguntas y abrir edición
              setTabValue(0);
              const preguntaBase = { ...viewingReport.pregunta };
              // Obtener detalle completo para asegurar campos opcionA-D, etc.
              const detalle = await fetchPreguntaDetalle(preguntaBase.id);
              const pregunta = normalizePregunta(detalle || preguntaBase);
              setEditingPregunta(pregunta);
              setOpenViewReportDialog(false);
              await loadTemasForPregunta(pregunta);
              setOpenEditDialog(true);
            }}
            startIcon={<EditIcon />}
          >
            Editar Pregunta
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

