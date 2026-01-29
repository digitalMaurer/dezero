import React, { useMemo } from 'react';
import {
  Paper,
  Box,
  TextField,
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
  Typography,
  Alert,
  Skeleton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const AdminPreguntasReports = ({
  reports,
  loadingReports,
  reportSearch,
  setReportSearch,
  reportStatusFilter,
  setReportStatusFilter,
  reportOposicionFilter,
  setReportOposicionFilter,
  reportTemaFilter,
  setReportTemaFilter,
  oposiciones,
  temasParaFiltro,
  loadReports,
  setViewingReport,
  setOpenViewReportDialog,
  handleResolveReport,
  handleDeleteReport,
  expandedReports,
  toggleReportExpand,
}) => {
  const temasForReportFilter = useMemo(() => {
    if (!reportOposicionFilter) return temasParaFiltro;
    return temasParaFiltro.filter((t) => t.oposicionId === reportOposicionFilter);
  }, [reportOposicionFilter, temasParaFiltro]);

  const filteredReports = useMemo(() => {
    const term = reportSearch.trim().toLowerCase();

    const matchesSearch = (report) => {
      if (!term) return true;
      const texto = [
        report.descripcion,
        report.pregunta?.enunciado,
        report.user?.nombre,
        report.user?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(term);
    };

    const matchesOposicion = (report) => {
      if (!reportOposicionFilter) return true;
      const opId = report.pregunta?.tema?.oposicion?.id || report.pregunta?.tema?.oposicionId;
      return opId === reportOposicionFilter;
    };

    const matchesTema = (report) => {
      if (!reportTemaFilter) return true;
      const temaId = report.pregunta?.tema?.id || report.pregunta?.temaId;
      return temaId === reportTemaFilter;
    };

    const sorted = [...(reports || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted.filter((r) => matchesSearch(r) && matchesOposicion(r) && matchesTema(r));
  }, [reports, reportSearch, reportOposicionFilter, reportTemaFilter]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Buscar (texto/usuario)"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={reportStatusFilter}
              label="Estado"
              onChange={(e) => setReportStatusFilter(e.target.value)}
            >
              <MenuItem value="PENDIENTE">Pendientes</MenuItem>
              <MenuItem value="RESUELTO">Resueltos</MenuItem>
              <MenuItem value="ALL">Todos</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Oposición</InputLabel>
            <Select
              value={reportOposicionFilter}
              label="Oposición"
              onChange={(e) => {
                setReportOposicionFilter(e.target.value);
                setReportTemaFilter('');
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {oposiciones.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{ minWidth: 200 }}
            disabled={!reportOposicionFilter && temasForReportFilter.length === 0}
          >
            <InputLabel>Tema</InputLabel>
            <Select
              value={reportTemaFilter}
              label="Tema"
              onChange={(e) => setReportTemaFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {temasForReportFilter.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => loadReports(reportStatusFilter)}
            disabled={loadingReports}
          >
            {loadingReports ? 'Actualizando...' : 'Refrescar'}
          </Button>
        </Box>
      </Paper>

      {loadingReports ? (
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
              {[...Array(4)].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton width={200} /></TableCell>
                  <TableCell><Skeleton width={180} /></TableCell>
                  <TableCell><Skeleton width={240} /></TableCell>
                  <TableCell><Skeleton width={140} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={160} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : filteredReports.length === 0 ? (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => loadReports(reportStatusFilter)}>
              Refrescar
            </Button>
          }
        >
          No hay reportes con los filtros actuales
        </Alert>
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
              {filteredReports.map((report) => (
                <React.Fragment key={report.id}>
                  <TableRow>
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
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                        <Button
                          size="small"
                          onClick={() => toggleReportExpand(report.id)}
                        >
                          {expandedReports.includes(report.id) ? 'Ocultar' : 'Ver completo'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {expandedReports.includes(report.id) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Detalle completo
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Reporte:</strong> {report.descripcion}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Pregunta:</strong> {report.pregunta?.enunciado || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Tema:</strong> {report.pregunta?.tema?.nombre || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Oposición:</strong> {report.pregunta?.tema?.oposicion?.nombre || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Creado: {new Date(report.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
