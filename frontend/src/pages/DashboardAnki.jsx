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
  Button,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { oposicionesService, ankiService } from '../services/apiServices';

export const DashboardAnki = () => {
  const [oposiciones, setOposiciones] = useState([]);
  const [statsGlobal, setStatsGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar oposiciones
      const oposResponse = await oposicionesService.getAll();
      const opos = oposResponse.data?.oposiciones || oposResponse.oposiciones || [];
      
      // Cargar estadísticas Anki para cada oposición
      const oposConStats = await Promise.all(
        opos.map(async (op) => {
          try {
            const statsResponse = await ankiService.getStatsByOposicion(op.id);
            return {
              ...op,
              ankiStats: statsResponse.data?.stats || statsResponse.stats,
            };
          } catch (err) {
            return { ...op, ankiStats: null };
          }
        })
      );

      setOposiciones(oposConStats);

      // Calcular stats globales
      const global = {
        totalPreguntas: 0,
        nuncaRevisadas: 0,
        vencidas: 0,
        hoy: 0,
        proximos7dias: 0,
        masAdelante: 0,
      };

      oposConStats.forEach((op) => {
        if (op.ankiStats) {
          global.totalPreguntas += op.ankiStats.total || 0;
          global.nuncaRevisadas += op.ankiStats.nuncaRevisadas || 0;
          global.vencidas += op.ankiStats.vencidas || 0;
          global.hoy += op.ankiStats.hoy || 0;
          global.proximos7dias += op.ankiStats.proximos7dias || 0;
          global.masAdelante += op.ankiStats.masAdelante || 0;
        }
      });

      setStatsGlobal(global);
    } catch (err) {
      setError('Error al cargar estadísticas Anki');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  const pendientesRepaso = (statsGlobal?.vencidas || 0) + (statsGlobal?.hoy || 0);
  const porcentajeRevisadas = statsGlobal?.totalPreguntas > 0
    ? ((statsGlobal.totalPreguntas - statsGlobal.nuncaRevisadas) / statsGlobal.totalPreguntas) * 100
    : 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <RepeatIcon sx={{ fontSize: 40, mr: 2, color: '#2e7d32' }} />
          <Box>
            <Typography variant="h3" component="h1">
              📊 Dashboard Anki
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Estadísticas de repetición espaciada
            </Typography>
          </Box>
        </Box>

        {/* Resumen Global */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: '#f5f5f5' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            🌍 Resumen Global
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Preguntas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {statsGlobal?.totalPreguntas || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#ffebee' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <ErrorIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                    Pendientes Repaso
                  </Typography>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {pendientesRepaso}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Vencidas + Hoy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <EventIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                    Próximos 7 días
                  </Typography>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {statsGlobal?.proximos7dias || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    <CheckCircleIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                    Nunca Revisadas
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {statsGlobal?.nuncaRevisadas || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Progreso de revisión: {porcentajeRevisadas.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={porcentajeRevisadas}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<RepeatIcon />}
              onClick={() => navigate('/test?mode=ANKI')}
              disabled={pendientesRepaso === 0}
            >
              Repasar Ahora ({pendientesRepaso})
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/test')}
            >
              Crear Nuevo Test
            </Button>
          </Box>
        </Paper>

        <Divider sx={{ mb: 4 }} />

        {/* Estadísticas por Oposición */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          📚 Por Oposición
        </Typography>

        <Grid container spacing={3}>
          {oposiciones.map((oposicion) => {
            const stats = oposicion.ankiStats;
            if (!stats) return null;

            const pendientes = (stats.vencidas || 0) + (stats.hoy || 0);
            const porcentaje = stats.total > 0
              ? ((stats.total - stats.nuncaRevisadas) / stats.total) * 100
              : 0;

            return (
              <Grid item xs={12} md={6} key={oposicion.id}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {oposicion.nombre}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                    {oposicion.codigo}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={`${stats.total} total`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${pendientes} pendientes`}
                      size="small"
                      color="error"
                      variant={pendientes > 0 ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label={`${stats.proximos7dias} próximos 7d`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      label={`${stats.nuncaRevisadas} sin revisar`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Progreso: {porcentaje.toFixed(0)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={porcentaje}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/test?mode=ANKI&oposicionId=${oposicion.id}`)}
                    disabled={pendientes === 0}
                  >
                    Repasar ({pendientes})
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
};
