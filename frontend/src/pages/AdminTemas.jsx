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
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { oposicionesService, temasService } from '../services/apiServices';

export const AdminTemas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selectedOposicion, setSelectedOposicion] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    oposicionId: '',
  });

  useEffect(() => {
    loadOposiciones();
  }, []);

  useEffect(() => {
    if (selectedOposicion) {
      loadTemas(selectedOposicion);
    } else {
      setTemas([]);
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

  const handleOpenDialog = (tema = null) => {
    if (tema) {
      setEditingTema(tema);
      setFormData({
        nombre: tema.nombre,
        descripcion: tema.descripcion || '',
        oposicionId: selectedOposicion,
      });
    } else {
      setEditingTema(null);
      setFormData({
        nombre: '',
        descripcion: '',
        oposicionId: selectedOposicion,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del tema es requerido');
      return;
    }

    if (!selectedOposicion) {
      setError('Selecciona una oposición');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingTema) {
        await temasService.update(editingTema.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });
        setSuccess('Tema actualizado');
      } else {
        await temasService.create({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          oposicionId: selectedOposicion,
        });
        setSuccess('Tema creado');
      }

      setOpenDialog(false);
      loadTemas(selectedOposicion);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar tema');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (temaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tema?')) {
      try {
        await temasService.delete(temaId);
        setSuccess('Tema eliminado');
        loadTemas(selectedOposicion);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar tema');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          📚 Gestión de Temas
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

        {/* Seleccionar Oposición */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Selecciona una Oposición</InputLabel>
            <Select
              value={selectedOposicion}
              onChange={(e) => setSelectedOposicion(e.target.value)}
              label="Selecciona una Oposición"
            >
              {oposiciones.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Botón Nuevo Tema */}
        {selectedOposicion && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mb: 3 }}
          >
            Nuevo Tema
          </Button>
        )}

        {/* Tabla de Temas */}
        {selectedOposicion && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {temas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No hay temas para esta oposición
                    </TableCell>
                  </TableRow>
                ) : (
                  temas.map((tema) => (
                    <TableRow key={tema.id}>
                      <TableCell>{tema.nombre}</TableCell>
                      <TableCell>{tema.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(tema)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(tema.id)}
                        >
                          Borrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTema ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            label="Nombre del Tema"
            fullWidth
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
