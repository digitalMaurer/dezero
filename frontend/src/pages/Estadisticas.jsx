import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import { testsService } from '../services/apiServices';

export const Estadisticas = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, historyResponse] = await Promise.all([
        testsService.getStats(),
        testsService.getHistory(),
      ]);
      // Backend devuelve { success: true, data: {...} }
      setStats(statsResponse.data);
      // Backend devuelve { success: true, data: { attempts: [...] } }
      const historyData = historyResponse.data?.attempts || historyResponse.attempts || [];
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError('Error al cargar las estadísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mis Estadísticas
        </Typography>

        {/* Resumen General */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tests Realizados
                </Typography>
                <Typography variant="h4">
                  {stats?.testsCompletados || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Promedio General
                </Typography>
                <Typography
                  variant="h4"
                  color={getScoreColor(stats?.promedioGeneral || 0)}
                >
                  {stats?.promedioGeneral
                    ? Math.round(stats.promedioGeneral)
                    : 0}
                  %
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Preguntas Respondidas
                </Typography>
                <Typography variant="h4">
                  {stats?.totalPreguntasRespondidas || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Racha Actual
                </Typography>
                <Typography variant="h4" color="primary">
                  {stats?.rachaActual || 0} días
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Estadísticas por Tema */}
        {stats?.porTema && stats.porTema.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Rendimiento por Tema
            </Typography>
            <Grid container spacing={2}>
              {stats.porTema.map((tema) => (
                <Grid item xs={12} sm={6} md={4} key={tema.temaId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {tema.temaNombre}
                      </Typography>
                      <Typography
                        variant="h5"
                        color={getScoreColor(tema.porcentajeAciertos)}
                      >
                        {Math.round(tema.porcentajeAciertos)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {tema.correctas}/{tema.total} correctas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Historial de Tests */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Historial de Tests
          </Typography>

          {history.length === 0 ? (
            <Alert severity="info">
              Aún no has realizado ningún test. ¡Empieza ahora!
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Oposición</TableCell>
                    <TableCell>Preguntas</TableCell>
                    <TableCell>Puntuación</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>{formatDate(test.fechaInicio)}</TableCell>
                      <TableCell>
                        {test.test?.oposicion?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>{test.totalPreguntas}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.round(
                            (test.respuestasCorrectas / test.totalPreguntas) *
                              100
                          )}%`}
                          color={getScoreColor(
                            (test.respuestasCorrectas / test.totalPreguntas) *
                              100
                          )}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            test.completado ? 'Completado' : 'En Progreso'
                          }
                          color={test.completado ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {test.completado && (
                          <Button
                            size="small"
                            onClick={() =>
                              navigate(`/test/results/${test.id}`)
                            }
                          >
                            Ver Resultados
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/oposiciones')}
          >
            Realizar Nuevo Test
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
