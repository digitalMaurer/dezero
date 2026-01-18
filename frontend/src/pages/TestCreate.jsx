import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { temasService, testsService } from '../services/apiServices';

export const TestCreate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oposicionId = searchParams.get('oposicionId');

  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    temaId: '',
    cantidad: 10,
    dificultad: '',
  });

  useEffect(() => {
    if (oposicionId) {
      loadTemas();
    }
  }, [oposicionId]);

  const loadTemas = async () => {
    try {
      setLoading(true);
      const response = await temasService.getAll(oposicionId);
      setTemas(response.data.temas);
    } catch (err) {
      setError('Error al cargar los temas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const testData = {
        oposicionId,
        cantidad: parseInt(formData.cantidad),
      };

      if (formData.temaId) {
        testData.temaId = formData.temaId;
      }

      if (formData.dificultad) {
        testData.dificultad = formData.dificultad;
      }

      const response = await testsService.createAttempt(testData);
      const attemptId = response.data.attemptId;

      // Guardar los datos del test en localStorage para acceder en TestTake
      localStorage.setItem(
        `test_${attemptId}`,
        JSON.stringify(response.data)
      );

      // Redirigir a la página del test
      navigate(`/test/${attemptId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al crear el test'
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          ✍️ Crear Nuevo Test
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Configura tu test personalizado
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tema (opcional)</InputLabel>
              <Select
                name="temaId"
                value={formData.temaId}
                onChange={handleChange}
                label="Tema (opcional)"
              >
                <MenuItem value="">
                  <em>Todos los temas</em>
                </MenuItem>
                {temas.map((tema) => (
                  <MenuItem key={tema.id} value={tema.id}>
                    {tema.nombre} ({tema._count?.preguntas || 0} preguntas)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              name="cantidad"
              label="Cantidad de preguntas"
              value={formData.cantidad}
              onChange={handleChange}
              sx={{ mb: 3 }}
              inputProps={{ min: 1, max: 50 }}
              required
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Dificultad (opcional)</InputLabel>
              <Select
                name="dificultad"
                value={formData.dificultad}
                onChange={handleChange}
                label="Dificultad (opcional)"
              >
                <MenuItem value="">
                  <em>Todas las dificultades</em>
                </MenuItem>
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="MEDIUM">Media</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/oposiciones')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creando...' : 'Iniciar Test'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
