import React, { useMemo, useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
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
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getDifficultyLabel, getDifficultyColor } from '../utils/difficulty';

export const AdminPreguntasManage = ({
  paginationInfo,
  preguntas = [],
  preguntasLimit,
  setPreguntasLimit,
  preguntasPage,
  setPreguntasPage,
  filtroTemaPreguntas,
  setFiltroTemaPreguntas,
  temasParaFiltro = [],
  oposiciones = [],
  targetOposicion,
  setTargetOposicion,
  targetTema,
  setTargetTema,
  targetTemas = [],
  handleBulkMove,
  handleMovePreguntaToTema,
  handleUpdatePreguntaOficial,
  handleUpdatePreguntaField,
  selectedIds = [],
  loading,
  toggleAll,
  toggleOne,
  handleEditOpen,
  handleDelete,
}) => {
  const totalPreguntas = paginationInfo?.total || preguntas.length;
  const currentPage = paginationInfo?.page;
  const totalPages = paginationInfo?.totalPages;

  const [individualOpen, setIndividualOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [individualIndex, setIndividualIndex] = useState(0);
  const [individualTemaId, setIndividualTemaId] = useState('');
  const [individualProcessing, setIndividualProcessing] = useState(false);

  const temaFiltro = useMemo(
    () => temasParaFiltro.find((t) => t.id === filtroTemaPreguntas),
    [temasParaFiltro, filtroTemaPreguntas]
  );

  const temasMismaOposicion = useMemo(() => {
    if (!temaFiltro) return temasParaFiltro;
    const oposicionId = temaFiltro.oposicionId || temaFiltro.oposicion?.id;
    if (!oposicionId) return temasParaFiltro;
    return temasParaFiltro.filter((t) => (t.oposicionId || t.oposicion?.id) === oposicionId);
  }, [temaFiltro, temasParaFiltro]);

  const currentIndividual = preguntas[individualIndex] || null;

  useEffect(() => {
    if (!individualOpen) return;
    if (!preguntas.length) {
      setIndividualOpen(false);
      setIndividualIndex(0);
      return;
    }
    if (individualIndex >= preguntas.length) {
      setIndividualIndex(Math.max(0, preguntas.length - 1));
    }
  }, [preguntas, individualIndex, individualOpen]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Total: {totalPreguntas} preguntas
      </Typography>

      {/* Filtros y paginación */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Filtrar por tema</InputLabel>
            <Select
              value={filtroTemaPreguntas}
              label="Filtrar por tema"
              onChange={(e) => {
                setFiltroTemaPreguntas(e.target.value);
                setPreguntasPage(1);
              }}
            >
              <MenuItem value="">Todos los temas</MenuItem>
              {temasParaFiltro.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Por página</InputLabel>
            <Select
              value={preguntasLimit}
              label="Por página"
              onChange={(e) => {
                setPreguntasLimit(parseInt(e.target.value, 10));
                setPreguntasPage(1);
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              disabled={!filtroTemaPreguntas || preguntas.length === 0}
              onClick={() => {
                setIndividualIndex(0);
                setIndividualTemaId('');
                setIndividualOpen(true);
              }}
            >
              Gestión individual
            </Button>
            {paginationInfo && (
              <Typography variant="body2" color="textSecondary">
                Página {currentPage} de {totalPages}
              </Typography>
            )}
            <Button
              variant="outlined"
              disabled={!paginationInfo || currentPage <= 1}
              onClick={() => setPreguntasPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outlined"
              disabled={!paginationInfo || currentPage >= totalPages}
              onClick={() => setPreguntasPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      </Paper>

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
                <TableCell>Oficial</TableCell>
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
                      label={p.esOficial ? 'Sí' : 'No'}
                      size="small"
                      color={p.esOficial ? 'primary' : 'default'}
                      variant={p.esOficial ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(p.dificultad)}
                      size="small"
                      color={getDifficultyColor(p.dificultad)}
                    />
                  </TableCell>
                  <TableCell>{p.respuestaCorrecta}</TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditOpen(p)}>
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

      <Dialog 
        open={individualOpen} 
        onClose={() => setIndividualOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle 
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            padding: '12px 16px',
            cursor: 'grab',
            userSelect: 'none',
            '&:active': { cursor: 'grabbing' },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>📋 {currentIndividual?.tema?.nombre || 'Tema'}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {preguntas.length > 0 ? `${individualIndex + 1}/${preguntas.length}` : 'N/A'}
          </span>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {currentIndividual ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Tema selector - ARRIBA */}
              <FormControl fullWidth size="small">
                <InputLabel>Tema destino</InputLabel>
                <Select
                  value={individualTemaId}
                  label="Tema destino"
                  onChange={(e) => setIndividualTemaId(e.target.value)}
                  sx={{
                    backgroundColor: '#f5f7fa',
                  }}
                >
                  {temasMismaOposicion.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status de oficial - inline */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: '500' }}>
                  Estado:
                </Typography>
                <Chip
                  label={currentIndividual.esOficial ? '✓ Oficial' : '✗ No oficial'}
                  size="small"
                  color={currentIndividual.esOficial ? 'primary' : 'default'}
                  variant={currentIndividual.esOficial ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Pregunta - EDITABLE */}
              <Box>
                {editingField === 'enunciado' ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      autoFocus
                      fullWidth
                      multiline
                      rows={2}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      size="small"
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={async () => {
                          await handleUpdatePreguntaField(currentIndividual.id, 'enunciado', editValue);
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={() => {
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: '600', 
                      fontSize: '1.05rem', 
                      lineHeight: 1.6, 
                      color: '#222',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: '#f0f0f0' }
                    }}
                    onClick={() => {
                      setEditingField('enunciado');
                      setEditValue(currentIndividual.enunciado);
                    }}
                  >
                    {currentIndividual.enunciado}
                  </Typography>
                )}
              </Box>

              {/* Opciones - EDITABLES */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 1 }}>
                {['opcionA', 'opcionB', 'opcionC', 'opcionD'].map((field, idx) => {
                  const letra = String.fromCharCode(65 + idx); // A, B, C, D
                  const value = currentIndividual[field];
                  if (!value) return null;

                  return (
                    <Box key={field}>
                      {editingField === field ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <TextField
                            autoFocus
                            fullWidth
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            variant="outlined"
                            inputProps={{ style: { fontSize: '0.85rem' } }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              sx={{ minWidth: '30px', p: '4px' }}
                              onClick={async () => {
                                await handleUpdatePreguntaField(currentIndividual.id, field, editValue);
                                setEditingField(null);
                                setEditValue('');
                              }}
                            >
                              ✓
                            </Button>
                            <Button
                              size="small"
                              sx={{ minWidth: '30px', p: '4px' }}
                              onClick={() => {
                                setEditingField(null);
                                setEditValue('');
                              }}
                            >
                              ✕
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography 
                          variant="body2"
                          sx={{
                            display: 'block',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '4px',
                            fontSize: '0.95rem',
                            '&:hover': { backgroundColor: '#f0f0f0' }
                          }}
                          onClick={() => {
                            setEditingField(field);
                            setEditValue(value);
                          }}
                        >
                          {letra}) {value}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Respuesta correcta - EDITABLE */}
              <Box sx={{ backgroundColor: '#e3f2fd', p: 1, borderRadius: 0.8 }}>
                {editingField === 'respuestaCorrecta' ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary">
                      Respuesta:
                    </Typography>
                    <TextField
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      size="small"
                      inputProps={{ maxLength: 1, style: { width: '40px', textAlign: 'center', fontWeight: 'bold' } }}
                    />
                    <Button
                      size="small"
                      sx={{ minWidth: '30px', p: '4px' }}
                      onClick={async () => {
                        await handleUpdatePreguntaField(currentIndividual.id, 'respuestaCorrecta', editValue);
                        setEditingField(null);
                        setEditValue('');
                      }}
                    >
                      ✓
                    </Button>
                    <Button
                      size="small"
                      sx={{ minWidth: '30px', p: '4px' }}
                      onClick={() => {
                        setEditingField(null);
                        setEditValue('');
                      }}
                    >
                      ✕
                    </Button>
                  </Box>
                ) : (
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ display: 'block', cursor: 'pointer' }}
                    onClick={() => {
                      setEditingField('respuestaCorrecta');
                      setEditValue(currentIndividual.respuestaCorrecta);
                    }}
                  >
                    Respuesta: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{currentIndividual.respuestaCorrecta}</span>
                  </Typography>
                )}
              </Box>

              {/* Tip - EDITABLE */}
              <Box sx={{ backgroundColor: '#fff3cd', p: 1, borderRadius: 0.8, border: '1px solid #ffc107' }}>
                {editingField === 'tip' ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      autoFocus
                      fullWidth
                      multiline
                      rows={2}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="Agregar un tip..."
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={async () => {
                          await handleUpdatePreguntaField(currentIndividual.id, 'tip', editValue);
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={() => {
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.1)' }
                    }}
                    onClick={() => {
                      setEditingField('tip');
                      setEditValue(currentIndividual.tip || '');
                    }}
                  >
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontWeight: '500' }}>
                      💡 Tip:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#856404' }}>
                      {currentIndividual.tip || '(sin tip)'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Explicación - EDITABLE */}
              <Box sx={{ backgroundColor: '#d1ecf1', p: 1, borderRadius: 0.8, border: '1px solid #17a2b8' }}>
                {editingField === 'explicacion' ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      autoFocus
                      fullWidth
                      multiline
                      rows={3}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="Agregar una explicación..."
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={async () => {
                          await handleUpdatePreguntaField(currentIndividual.id, 'explicacion', editValue);
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="small"
                        sx={{ minWidth: '30px', p: '4px' }}
                        onClick={() => {
                          setEditingField(null);
                          setEditValue('');
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: 'rgba(23, 162, 184, 0.1)' }
                    }}
                    onClick={() => {
                      setEditingField('explicacion');
                      setEditValue(currentIndividual.explicacion || '');
                    }}
                  >
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'block', fontWeight: '500' }}>
                      📖 Explicación:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0c5460' }}>
                      {currentIndividual.explicacion || '(sin explicación)'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography>No hay preguntas disponibles.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setIndividualOpen(false);
              setIndividualIndex(0);
              setEditingField(null);
              setEditValue('');
            }}
          >
            ✕ Cerrar
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => {
                if (!currentIndividual?.id) return;
                if (window.confirm('¿Seguro que quieres eliminar esta pregunta?')) {
                  handleDelete(currentIndividual.id);
                  if (individualIndex >= preguntas.length - 1) {
                    setIndividualOpen(false);
                    setIndividualIndex(0);
                  }
                }
              }}
              disabled={!currentIndividual || individualProcessing}
            >
              🗑️ Eliminar
            </Button>

            <Button
              size="small"
              onClick={async () => {
                if (!currentIndividual?.id) return;
                setIndividualProcessing(true);
                await handleUpdatePreguntaOficial(currentIndividual.id, !currentIndividual.esOficial);
                setIndividualProcessing(false);
              }}
              disabled={!currentIndividual || individualProcessing}
            >
              {currentIndividual?.esOficial ? '📌 Quitar oficial' : '📍 Marcar oficial'}
            </Button>

            <Button
              size="small"
              onClick={() => {
                if (individualIndex < preguntas.length - 1) {
                  setIndividualIndex((prev) => prev + 1);
                } else {
                  setIndividualOpen(false);
                  setIndividualIndex(0);
                }
              }}
            >
              ⏭️ Siguiente
            </Button>

            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={!individualTemaId || !currentIndividual || individualProcessing}
              onClick={async () => {
                if (!currentIndividual?.id || !individualTemaId) return;
                setIndividualProcessing(true);
                await handleMovePreguntaToTema(currentIndividual.id, individualTemaId);
                setIndividualProcessing(false);
                if (individualIndex < preguntas.length - 1) {
                  setIndividualIndex((prev) => prev + 1);
                } else {
                  setIndividualOpen(false);
                  setIndividualIndex(0);
                }
              }}
            >
              ✅ Mover a tema
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
