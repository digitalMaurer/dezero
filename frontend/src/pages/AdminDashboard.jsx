import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PeopleIcon from '@mui/icons-material/People';
import BackupIcon from '@mui/icons-material/Backup';
import { maintenanceService } from '../services/apiServices';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef(null);

  const adminOptions = [
    {
      title: 'Gestionar Preguntas',
      description: 'Importar, editar y eliminar preguntas',
      icon: <QuestionAnswerIcon sx={{ fontSize: 50 }} />,
      path: '/admin/preguntas',
      color: '#667eea',
    },
    {
      title: 'Gestionar Temas',
      description: 'Crear, editar y eliminar temas',
      icon: <LibraryBooksIcon sx={{ fontSize: 50 }} />,
      path: '/admin/temas',
      color: '#764ba2',
    },
    {
      title: 'Gestionar Oposiciones',
      description: 'Crear, editar y eliminar oposiciones',
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      path: '/admin/oposiciones',
      color: '#f093fb',
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Ver usuarios y cambiar permisos',
      icon: <PeopleIcon sx={{ fontSize: 50 }} />,
      path: '/admin/usuarios',
      color: '#4facfe',
    },
  ];

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const response = await maintenanceService.downloadDbBackup();
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers?.['content-disposition']?.split('filename=')[1] || 'dev_backup.db';
      link.setAttribute('download', filename.replace(/"/g, ''));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('No se pudo generar el backup. Revisa que eres admin y que el backend esté disponible.');
      console.error(error);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm('Esto sustituirá la base de datos actual. ¿Continuar?');
    if (!confirmed) return;

    try {
      setRestoreLoading(true);
      const result = await maintenanceService.restoreDbBackup(file);
      alert(result?.message || 'Base de datos restaurada. Reinicia el backend para aplicar cambios.');
    } catch (error) {
      alert('No se pudo restaurar el backup. Revisa que eres admin y que el backend esté disponible.');
      console.error(error);
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          🛡️ Panel de Administración
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Gestiona todos los aspectos del sistema de oposiciones
        </Typography>

        <Grid container spacing={3}>
          {adminOptions.map((option, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  <Box sx={{ color: option.color, mb: 2 }}>{option.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {option.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(option.path)}
                    sx={{ backgroundColor: option.color }}
                  >
                    Acceder
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Información útil */}
        <Box sx={{ mt: 6, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📌 Información Importante
          </Typography>
          <Typography variant="body2" paragraph>
            ✅ Solo los administradores pueden acceder a este panel
          </Typography>
          <Typography variant="body2" paragraph>
            ✅ Todas las cambios se guardan automáticamente en la base de datos
          </Typography>
          <Typography variant="body2" paragraph>
            ✅ Las preguntas importadas estarán disponibles inmediatamente
          </Typography>
          <Typography variant="body2">
            ✅ Puedes editar o eliminar cualquier elemento en cualquier momento
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BackupIcon />}
              onClick={handleBackup}
              disabled={backupLoading}
            >
              {backupLoading ? 'Generando backup...' : 'Descargar backup de base de datos'}
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<BackupIcon />}
              onClick={handleRestoreClick}
              disabled={restoreLoading}
            >
              {restoreLoading ? 'Restaurando...' : 'Restaurar backup (subir archivo)'}
            </Button>

            <input
              type="file"
              accept=".db"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleRestoreFile}
            />
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};
