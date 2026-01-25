import React from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
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
    </Box>
  );
};
