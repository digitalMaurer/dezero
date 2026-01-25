import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
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
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { oposicionesService } from '../services/apiServices';

export const AdminOposiciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [oposiciones, setOposiciones] = useState([]);
  const [mostrarOcultas, setMostrarOcultas] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingOposicion, setEditingOposicion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
  });

  useEffect(() => {
    loadOposiciones();
  }, []);

  const loadOposiciones = async () => {
    try {
      setLoading(true);
      const response = await oposicionesService.getAll();
      // Backend devuelve { success: true, data: { oposiciones: [...] } }
      const data = response.data?.oposiciones || response.oposiciones || [];
      setOposiciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar oposiciones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (oposicion = null) => {
    if (oposicion) {
      setEditingOposicion(oposicion);
      setFormData({
        nombre: oposicion.nombre,
        codigo: oposicion.codigo || '',
        descripcion: oposicion.descripcion || '',
      });
    } else {
      setEditingOposicion(null);
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre de la oposición es requerido');
      return;
    }
    if (!formData.codigo.trim()) {
      setError('El código de la oposición es requerido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingOposicion) {
        await oposicionesService.update(editingOposicion.id, {
          nombre: formData.nombre,
          codigo: formData.codigo,
          descripcion: formData.descripcion,
        });
        setSuccess('Oposición actualizada');
      } else {
        await oposicionesService.create({
          nombre: formData.nombre,
          codigo: formData.codigo,
          descripcion: formData.descripcion,
        });
        setSuccess('Oposición creada');
      }

      setOpenDialog(false);
      loadOposiciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar oposición');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (oposicionId) => {
    if (
      window.confirm(
        '⚠️ Esto eliminará la oposición Y todos sus temas y preguntas. ¿Estás seguro?'
      )
    ) {
      try {
        await oposicionesService.delete(oposicionId);
        setSuccess('Oposición eliminada');
        loadOposiciones();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar oposición');
      }
    }
  };

  const handleToggleVisibility = async (oposicion) => {
    try {
      setLoading(true);
      setError(null);
      const nuevoEstado = !oposicion.visible;
      await oposicionesService.update(oposicion.id, {
        visible: nuevoEstado,
      });
      setSuccess(`Oposición ${nuevoEstado ? 'mostrada' : 'ocultada'}`);
      loadOposiciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al cambiar visibilidad de oposición');
    } finally {
      setLoading(false);
    }
  };

  const oposicionesFiltradas = mostrarOcultas
    ? oposiciones
    : oposiciones.filter((op) => op.visible !== false);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          🎓 Gestión de Oposiciones
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

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Oposición
          </Button>
          <FormControlLabel
            control={<Checkbox checked={mostrarOcultas} onChange={(e) => setMostrarOcultas(e.target.checked)} />}
            label="Mostrar ocultas"
          />
        </Box>

        {/* Tabla de Oposiciones */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {oposicionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay oposiciones {mostrarOcultas ? '' : 'visibles'}
                    </TableCell>
                  </TableRow>
                ) : (
                  oposicionesFiltradas.map((oposicion) => (
                    <TableRow key={oposicion.id}>
                      <TableCell>{oposicion.nombre}</TableCell>
                      <TableCell>{oposicion.codigo}</TableCell>
                      <TableCell>{oposicion.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={oposicion.visible !== false ? 'Visible' : 'Oculta'}
                          color={oposicion.visible !== false ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={oposicion.visible !== false ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          onClick={() => handleToggleVisibility(oposicion)}
                          variant="outlined"
                        >
                          {oposicion.visible !== false ? 'Ocultar' : 'Mostrar'}
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(oposicion)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(oposicion.id)}
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
        <DialogTitle>
          {editingOposicion ? 'Editar Oposición' : 'Nueva Oposición'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            label="Nombre de la Oposición"
            fullWidth
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Código de la Oposición"
            fullWidth
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            sx={{ mb: 2 }}
            disabled={!!editingOposicion}
            helperText={editingOposicion ? 'El código no se puede modificar' : 'Ej: POLICIA-NACIONAL'}
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
