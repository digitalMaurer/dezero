import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import { testsService } from '../services/apiServices';

export const TestTake = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    loadTest();
  }, [attemptId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      // Simulamos que tenemos el testData del localStorage o de la creación
      const cachedTest = localStorage.getItem(`test_${attemptId}`);
      if (cachedTest) {
        setTestData(JSON.parse(cachedTest));
      } else {
        // Si no está en cache, tenemos que obtenerlo del backend
        setError('No se encontró la información del test');
      }
    } catch (err) {
      setError('Error al cargar el test');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (preguntaId, respuesta) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: respuesta,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < testData.preguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (
      Object.keys(respuestas).length < testData.preguntas.length &&
      !window.confirm('No has respondido todas las preguntas. ¿Deseas enviar igualmente?')
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const respuestasArray = testData.preguntas.map((pregunta) => ({
        preguntaId: pregunta.id,
        respuestaUsuario: respuestas[pregunta.id] || 'A', // Respuesta por defecto si no respondió
      }));

      const response = await testsService.submitAttempt(attemptId, respuestasArray);

      // Limpiar cache
      localStorage.removeItem(`test_${attemptId}`);

      // Navegar a resultados
      navigate(`/test/results/${attemptId}`, {
        state: { results: response.data },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el test');
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

  if (!testData || !testData.preguntas || testData.preguntas.length === 0) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          No se pudo cargar el test
        </Alert>
      </Container>
    );
  }

  const currentQuestion = testData.preguntas[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.preguntas.length) * 100;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">
              Pregunta {currentQuestionIndex + 1} de {testData.preguntas.length}
            </Typography>
            <Chip
              label={currentQuestion.dificultad}
              color={
                currentQuestion.dificultad === 'EASY'
                  ? 'success'
                  : currentQuestion.dificultad === 'MEDIUM'
                  ? 'warning'
                  : 'error'
              }
              size="small"
            />
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.titulo}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {currentQuestion.enunciado}
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={respuestas[currentQuestion.id] || ''}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, e.target.value)
              }
            >
              <FormControlLabel
                value="A"
                control={<Radio />}
                label={`A) ${currentQuestion.opcionA}`}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="B"
                control={<Radio />}
                label={`B) ${currentQuestion.opcionB}`}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="C"
                control={<Radio />}
                label={`C) ${currentQuestion.opcionC}`}
                sx={{ mb: 1 }}
              />
              {currentQuestion.opcionD && (
                <FormControlLabel
                  value="D"
                  control={<Radio />}
                  label={`D) ${currentQuestion.opcionD}`}
                />
              )}
            </RadioGroup>
          </FormControl>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </Button>

          {currentQuestionIndex === testData.preguntas.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Finalizar Test'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Siguiente
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Respondidas: {Object.keys(respuestas).length} / {testData.preguntas.length}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
