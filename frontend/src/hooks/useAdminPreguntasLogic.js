import { useState, useEffect } from 'react';
import { oposicionesService, temasService, preguntasService, reportsService } from '../services/apiServices';
import { parsePreguntasImportText } from '../utils/parsePreguntasImport';

export const useAdminPreguntasLogic = () => {
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
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDIENTE');
  const [reportOposicionFilter, setReportOposicionFilter] = useState('');
  const [reportTemaFilter, setReportTemaFilter] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [expandedReports, setExpandedReports] = useState([]);

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

  // Paginación y filtros de preguntas
  const [preguntasPage, setPreguntasPage] = useState(1);
  const [preguntasLimit, setPreguntasLimit] = useState(50);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [filtroTemaPreguntas, setFiltroTemaPreguntas] = useState('');
  const [temasParaFiltro, setTemasParaFiltro] = useState([]);

  useEffect(() => {
    loadOposiciones();
    loadAllTemasForFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadReports(reportStatusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportStatusFilter]);

  useEffect(() => {
    loadPreguntas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntasPage, preguntasLimit, filtroTemaPreguntas]);

  useEffect(() => {
    if (selectedOposicion) {
      loadTemas(selectedOposicion);
      loadTemasParaFiltro(selectedOposicion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOposicion]);

  useEffect(() => {
    if (selectedOposicionImage) {
      loadTemasImagen(selectedOposicionImage);
    } else {
      setTemasImagen([]);
      setSelectedTemaImage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOposicion]);

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedIds(preguntas.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
      const data = response.data?.oposiciones || response.oposiciones || [];
      // Filtrar solo oposiciones visibles para el usuario
      const visibles = Array.isArray(data) ? data.filter((op) => op.visible !== false) : [];
      setOposiciones(visibles);
    } catch (err) {
      console.error(err);
      setError('Error al cargar oposiciones');
    }
  };

  const loadTemas = async (oposicionId) => {
    try {
      const response = await temasService.getAll(oposicionId);
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

  const loadTemasParaFiltro = async (oposicionId) => {
    try {
      const response = await temasService.getAll(oposicionId);
      const data = response.data?.temas || response.temas || [];
      setTemasParaFiltro(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTemasParaFiltro([]);
    }
  };

  const loadAllTemasForFilter = async () => {
    try {
      const response = await oposicionesService.getAll();
      const ops = response.data?.oposiciones || response.oposiciones || [];
      let allTemas = [];

      for (const op of ops) {
        try {
          const temasResp = await temasService.getAll(op.id);
          const temasData = temasResp.data?.temas || temasResp.temas || [];
          allTemas = [...allTemas, ...temasData];
        } catch (e) {
          console.error(`Error cargando temas de oposición ${op.id}:`, e);
        }
      }

      const uniqueTemas = [];
      const visto = new Set();
      allTemas.forEach((t) => {
        if (!visto.has(t.id)) {
          uniqueTemas.push(t);
          visto.add(t.id);
        }
      });

      setTemasParaFiltro(uniqueTemas);
    } catch (err) {
      console.error('Error cargando todos los temas:', err);
      setTemasParaFiltro([]);
    }
  };

  const loadPreguntas = async () => {
    try {
      setLoading(true);
      const params = { limit: preguntasLimit, page: preguntasPage };
      if (filtroTemaPreguntas) {
        params.temaId = filtroTemaPreguntas;
      }
      const response = await preguntasService.getAll(params);
      const data = response.data?.preguntas || response.preguntas || [];
      setPreguntas(Array.isArray(data) ? data : []);
      setPaginationInfo(response.data?.pagination || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar preguntas');
      setPreguntas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemasForPregunta = async (pregunta) => {
    try {
      let oposicionId = pregunta?.tema?.oposicionId || pregunta?.tema?.oposicion?.id;

      if (!oposicionId && pregunta?.id) {
        try {
          const detail = await preguntasService.getById(pregunta.id);
          const preguntaDetallada = detail.data?.pregunta || detail.pregunta;
          oposicionId = preguntaDetallada?.tema?.oposicionId || preguntaDetallada?.tema?.oposicion?.id;
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

      const preguntasParsed = parsePreguntasImportText(importText);

      preguntasParsed.forEach((p, idx) => {
        if (!['A', 'B', 'C', 'D'].includes(p.respuestacorrecta)) {
          throw new Error(`Pregunta ${idx + 1}: La respuesta correcta debe ser A, B, C o D`);
        }
      });

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
            dificultad: 'MEDIUM',
            status: 'PUBLISHED',
            temaId: selectedTema,
          });
          importadas++;
        } catch (err) {
          console.error(`Error al importar pregunta ${p.id}:`, err);
        }
      }

      setSuccess(`✅ ${importadas} de ${preguntasParsed.length} preguntas importadas correctamente`);
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

  const loadReports = async (estadoActual = reportStatusFilter) => {
    try {
      setLoadingReports(true);
      const params = { limit: 500 };
      if (estadoActual && estadoActual !== 'ALL') {
        params.estado = estadoActual;
      }
      const response = await reportsService.getAll(params);
      const data = response.data?.reports || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoadingReports(false);
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

  const handleResolveReport = async (reportId) => {
    try {
      await reportsService.update(reportId, { estado: 'RESUELTO' });
      setSuccess('Reporte marcado como resuelto');
      loadReports(reportStatusFilter);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al marcar como resuelto');
    }
  };

  const handleCloseReportDialog = () => {
    setOpenViewReportDialog(false);
    setViewingReport(null);
  };

  const handleEditFromReport = async () => {
    if (!viewingReport?.pregunta?.id) return;
    try {
      setTabValue(2);
      const basePregunta = { ...viewingReport.pregunta };
      const detalle = await fetchPreguntaDetalle(basePregunta.id);
      const pregunta = normalizePregunta(detalle || basePregunta);
      setEditingPregunta(pregunta);
      handleCloseReportDialog();
      await loadTemasForPregunta(pregunta);
      setOpenEditDialog(true);
    } catch (err) {
      console.error('Error al abrir edición desde reporte:', err);
      setError('No se pudo abrir la edición de la pregunta reportada');
    }
  };

  const handleEditOpen = async (pregunta) => {
    setEditingPregunta({ ...pregunta });
    setOpenEditDialog(true);
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
        temaId: editingPregunta.temaId,
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

  const toggleReportExpand = (id) => {
    setExpandedReports((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return {
    // UI state
    tabValue,
    setTabValue,
    loading,
    error,
    success,
    setError,
    setSuccess,

    // Import text
    importText,
    setImportText,
    selectedOposicion,
    setSelectedOposicion,
    selectedTema,
    setSelectedTema,

    // Import image
    selectedOposicionImage,
    setSelectedOposicionImage,
    selectedTemaImage,
    setSelectedTemaImage,
    temasImagen,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    imageForm,
    setImageForm,
    uploadingImage,

    // Data lists
    oposiciones,
    temas,
    preguntas,
    reports,
    loadingReports,
    reportStatusFilter,
    setReportStatusFilter,
    reportOposicionFilter,
    setReportOposicionFilter,
    reportTemaFilter,
    setReportTemaFilter,
    reportSearch,
    setReportSearch,
    expandedReports,
    toggleReportExpand,

    // Bulk
    selectedIds,
    targetOposicion,
    setTargetOposicion,
    targetTema,
    setTargetTema,
    targetTemas,

    // Dialogs
    openEditDialog,
    setOpenEditDialog,
    editingPregunta,
    setEditingPregunta,
    openViewReportDialog,
    setOpenViewReportDialog,
    viewingReport,
    setViewingReport,

    // Edit helpers
    temasEdicion,

    // Pagination
    preguntasPage,
    setPreguntasPage,
    preguntasLimit,
    setPreguntasLimit,
    paginationInfo,
    filtroTemaPreguntas,
    setFiltroTemaPreguntas,
    temasParaFiltro,

    // Handlers
    handleBulkMove,
    handleImport,
    handleCreateWithImage,
    handleDelete,
    handleResolveReport,
    handleDeleteReport,
    handleCloseReportDialog,
    handleEditFromReport,
    handleEditOpen,
    handleEditSave,
    toggleAll,
    toggleOne,
    handleImageFileChange,
    loadReports,
  };
};
