import React, { useState } from 'react';
import { Container, Box, Typography, Alert, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { AdminPreguntasReports } from './AdminPreguntasReports';
import { AdminPreguntasImportText } from './AdminPreguntasImportText';
import { AdminPreguntasImportImage } from './AdminPreguntasImportImage';
import { AdminPreguntasManage } from './AdminPreguntasManage';
import { AdminPreguntasEditDialog } from './AdminPreguntasEditDialog';
import { AdminPreguntasReportDialog } from './AdminPreguntasReportDialog';
import { AdminPreguntasDuplicates } from './AdminPreguntasDuplicates';
import { useAdminPreguntasLogic } from '../hooks/useAdminPreguntasLogic';

export const AdminPreguntas = () => {
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [reportToResolve, setReportToResolve] = useState(null);
  const {
    tabValue,
    setTabValue,
    loading,
    error,
    success,
    importText,
    setImportText,
    importIsOfficial,
    setImportIsOfficial,
    selectedOposicion,
    setSelectedOposicion,
    selectedTema,
    setSelectedTema,
    selectedOposicionImage,
    setSelectedOposicionImage,
    selectedTemaImage,
    setSelectedTemaImage,
    temasImagen,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    imageForm,
    setImageForm,
    uploadingImage,
    oposiciones,
    temas,
    preguntas,
    reports,
    loadingReports,
    reportStatusFilter,
    setReportStatusFilter,
    reportOposicionFilter,
    setReportOposicionFilter,
    reportTemaFilter,
    setReportTemaFilter,
    reportSearch,
    setReportSearch,
    expandedReports,
    toggleReportExpand,
    selectedIds,
    targetOposicion,
    setTargetOposicion,
    targetTema,
    setTargetTema,
    targetTemas,
    openEditDialog,
    setOpenEditDialog,
    editingPregunta,
    setEditingPregunta,
    openViewReportDialog,
    setOpenViewReportDialog,
    viewingReport,
    setViewingReport,
    temasEdicion,
    preguntasPage,
    setPreguntasPage,
    preguntasLimit,
    setPreguntasLimit,
    paginationInfo,
    filtroTemaPreguntas,
    setFiltroTemaPreguntas,
    temasParaFiltro,
    // Duplicados
    duplicateTemaFilter,
    setDuplicateTemaFilter,
    duplicateGroups,
    duplicateThreshold,
    setDuplicateThreshold,
    duplicateLimit,
    setDuplicateLimit,
    duplicateLoading,
    handleScanDuplicates,
    handleMarkFalsePositive,
    handleMergeGroup,
    handleBulkMove,
    handleMovePreguntaToTema,
    handleUpdatePreguntaOficial,
    handleUpdatePreguntaField,
    handleImport,
    handleCreateWithImage,
    handleDelete,
    handleResolveReport,
    handleDeleteReport,
    handleCloseReportDialog,
    handleEditFromReport,
    handleEditOpen,
    handleEditSave,
    toggleAll,
    toggleOne,
    loadReports,
  } = useAdminPreguntasLogic();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          🎓 Gestión de Preguntas
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="📥 Importar Preguntas" />
            <Tab label="🖼️ Importar con Imagen" />
            <Tab label="📋 Gestionar Preguntas" />
            <Tab label="🔁 Duplicados" />
            <Tab label={`🚩 Reportes (${reports.length})`} />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <AdminPreguntasImportText
            importText={importText}
            setImportText={setImportText}
            importIsOfficial={importIsOfficial}
            setImportIsOfficial={setImportIsOfficial}
            selectedOposicion={selectedOposicion}
            setSelectedOposicion={setSelectedOposicion}
            selectedTema={selectedTema}
            setSelectedTema={setSelectedTema}
            oposiciones={oposiciones}
            temas={temas}
            loading={loading}
            handleImport={handleImport}
          />
        )}

        {tabValue === 1 && (
          <AdminPreguntasImportImage
            oposiciones={oposiciones}
            selectedOposicionImage={selectedOposicionImage}
            setSelectedOposicionImage={setSelectedOposicionImage}
            selectedTemaImage={selectedTemaImage}
            setSelectedTemaImage={setSelectedTemaImage}
            temasImagen={temasImagen}
            imageFile={imageFile}
            setImageFile={setImageFile}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            imageForm={imageForm}
            setImageForm={setImageForm}
            uploadingImage={uploadingImage}
            loading={loading}
            handleCreateWithImage={handleCreateWithImage}
          />
        )}

        {tabValue === 2 && (
          <AdminPreguntasManage
            paginationInfo={paginationInfo}
            preguntas={preguntas}
            preguntasLimit={preguntasLimit}
            setPreguntasLimit={setPreguntasLimit}
            preguntasPage={preguntasPage}
            setPreguntasPage={setPreguntasPage}
            filtroTemaPreguntas={filtroTemaPreguntas}
            setFiltroTemaPreguntas={setFiltroTemaPreguntas}
            temasParaFiltro={temasParaFiltro}
            oposiciones={oposiciones}
            targetOposicion={targetOposicion}
            setTargetOposicion={setTargetOposicion}
            targetTema={targetTema}
            setTargetTema={setTargetTema}
            targetTemas={targetTemas}
            handleBulkMove={handleBulkMove}
            handleMovePreguntaToTema={handleMovePreguntaToTema}
            handleUpdatePreguntaOficial={handleUpdatePreguntaOficial}
            handleUpdatePreguntaField={handleUpdatePreguntaField}
            selectedIds={selectedIds}
            loading={loading}
            toggleAll={toggleAll}
            toggleOne={toggleOne}
            handleEditOpen={handleEditOpen}
            handleDelete={handleDelete}
          />
        )}

        {tabValue === 3 && (
          <AdminPreguntasDuplicates
            temasParaFiltro={temasParaFiltro}
            duplicateTemaFilter={duplicateTemaFilter}
            setDuplicateTemaFilter={setDuplicateTemaFilter}
            duplicateGroups={duplicateGroups}
            duplicateThreshold={duplicateThreshold}
            setDuplicateThreshold={setDuplicateThreshold}
            duplicateLimit={duplicateLimit}
            setDuplicateLimit={setDuplicateLimit}
            duplicateLoading={duplicateLoading}
            handleScanDuplicates={handleScanDuplicates}
            handleMarkFalsePositive={handleMarkFalsePositive}
            handleMergeGroup={handleMergeGroup}
          />
        )}

        {tabValue === 4 && (
          <AdminPreguntasReports
            reports={reports}
            loadingReports={loadingReports}
            reportSearch={reportSearch}
            setReportSearch={setReportSearch}
            reportStatusFilter={reportStatusFilter}
            setReportStatusFilter={setReportStatusFilter}
            reportOposicionFilter={reportOposicionFilter}
            setReportOposicionFilter={setReportOposicionFilter}
            reportTemaFilter={reportTemaFilter}
            setReportTemaFilter={setReportTemaFilter}
            oposiciones={oposiciones}
            temasParaFiltro={temasParaFiltro}
            loadReports={loadReports}
            setViewingReport={setViewingReport}
            setOpenViewReportDialog={setOpenViewReportDialog}
            handleResolveReport={handleResolveReport}
            handleDeleteReport={handleDeleteReport}
            expandedReports={expandedReports}
            toggleReportExpand={toggleReportExpand}
          />
        )}
      </Box>

      <AdminPreguntasEditDialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setReportToResolve(null);
        }}
        editingPregunta={editingPregunta}
        setEditingPregunta={setEditingPregunta}
        temasEdicion={temasEdicion}
        onSave={async () => {
          await handleEditSave();
          if (reportToResolve) setShowResolveModal(true);
        }}
        onDelete={async (id) => {
          await handleDelete(id);
          setOpenEditDialog(false);
          setReportToResolve(null);
        }}
      />

      <AdminPreguntasReportDialog
        open={openViewReportDialog}
        viewingReport={viewingReport}
        onClose={handleCloseReportDialog}
        onEdit={(report) => {
          setReportToResolve(report.id);
          handleEditFromReport();
        }}
        onDeleteQuestion={async (preguntaId) => {
          await handleDelete(preguntaId);
          handleCloseReportDialog();
          loadReports();
        }}
        onRemoveReport={async (reportId) => {
          await handleDeleteReport(reportId);
          handleCloseReportDialog();
          loadReports();
        }}
      />

      {/* Modal de confirmación post-edición */}
      <Dialog open={showResolveModal} onClose={() => setShowResolveModal(false)}>
        <DialogTitle>¿Ha resuelto el reporte?</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas marcar el reporte como resuelto y eliminarlo?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowResolveModal(false);
            setTabValue(4); // Volver a la pestaña de reportes
          }} color="inherit">No</Button>
          <Button
            onClick={async () => {
              await handleDeleteReport(reportToResolve);
              setShowResolveModal(false);
              setReportToResolve(null);
              setTabValue(4); // Volver a la pestaña de reportes
            }}
            color="primary"
            variant="contained"
          >
            Sí, eliminar reporte
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

