import apiClient from './api';

export const oposicionesService = {
  async getAll() {
    const response = await apiClient.get('/oposiciones');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/oposiciones/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/oposiciones', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put(`/oposiciones/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/oposiciones/${id}`);
    return response.data;
  },
};

export const temasService = {
  async getAll(oposicionId) {
    const response = await apiClient.get('/temas', {
      params: { oposicionId },
    });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/temas/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/temas', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put(`/temas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/temas/${id}`);
    return response.data;
  },

  async copy(id, targetOposicionId) {
    const response = await apiClient.post(`/temas/${id}/copy`, { targetOposicionId });
    return response.data;
  },
};

export const preguntasService = {
  async getAll(params) {
    const response = await apiClient.get('/preguntas', { params });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/preguntas/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/preguntas', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put(`/preguntas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/preguntas/${id}`);
    return response.data;
  },

  async getSimilar(id, params = {}) {
    const response = await apiClient.get(`/preguntas/${id}/similar`, { params });
    return response.data;
  },

  async scanDuplicates(params = {}) {
    const response = await apiClient.get('/preguntas/duplicates/scan', { params });
    return response.data;
  },

  async markDuplicateFalsePositive(preguntaAId, preguntaBId) {
    const response = await apiClient.post('/preguntas/duplicates/false-positive', {
      preguntaAId,
      preguntaBId,
    });
    return response.data;
  },

  async mergeDuplicates({ masterPreguntaId, duplicateIds, mergeStrategy = 'KEEP_MASTER' }) {
    const response = await apiClient.post('/preguntas/duplicates/merge', {
      masterPreguntaId,
      duplicateIds,
      mergeStrategy,
    });
    return response.data;
  },

  async bulkUpdateTema(ids, temaId) {
    const response = await apiClient.post('/preguntas/bulk-update-tema', { ids, temaId });
    return response.data;
  },

  async reportQuestion(preguntaId, data) {
    const response = await apiClient.post(`/preguntas/${preguntaId}/report`, data);
    return response.data;
  },

  async uploadImage(formData) {
    const response = await apiClient.post('/preguntas/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const testsService = {
  async createAttempt(data) {
    const response = await apiClient.post('/tests/attempts', data);
    return response.data;
  },

  async submitAttempt(attemptId, respuestas) {
    const response = await apiClient.post('/tests/attempts/submit', {
      attemptId,
      respuestas,
    });
    return response.data;
  },

  async finishAttempt(id) {
    const response = await apiClient.post(`/tests/attempts/${id}/finish`);
    return response.data;
  },

  async answerQuestion(attemptId, payload) {
    const response = await apiClient.post(`/tests/attempts/${attemptId}/answer`, payload);
    return response.data;
  },

  async getNextManicomioQuestion(attemptId) {
    const response = await apiClient.get(`/tests/attempts/${attemptId}/next-question`);
    return response.data;
  },

  async getAttempt(id) {
    const response = await apiClient.get(`/tests/attempts/${id}`);
    return response.data;
  },

  async deleteAttempt(id) {
    const response = await apiClient.delete(`/tests/attempts/${id}`);
    return response.data;
  },

  async getHistory(page = 1, limit = 10) {
    const response = await apiClient.get('/tests/history', {
      params: { page, limit },
    });
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/tests/stats');
    return response.data;
  },

  async exportAttemptToPDF(attemptId, withAnswers = false) {
    const response = await apiClient.get(`/tests/attempts/${attemptId}/export-pdf`, {
      params: { withAnswers: withAnswers ? 'true' : 'false' },
      responseType: 'blob',
    });
    return response;
  },
};

export const reportsService = {
  async getAll(params) {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  },

  async getByPregunta(preguntaId) {
    const response = await apiClient.get(`/preguntas/${preguntaId}/reports`);
    return response.data;
  },

  async updateStatus(reportId, estado) {
    const response = await apiClient.patch(`/reports/${reportId}/status`, { estado });
    return response.data;
  },

  async delete(reportId) {
    const response = await apiClient.delete(`/reports/${reportId}`);
    return response.data;
  },

  async deleteByPregunta(preguntaId) {
    const response = await apiClient.delete(`/preguntas/${preguntaId}/reports`);
    return response.data;
  },
};

export const favoritesService = {
  async toggle(preguntaId) {
    const response = await apiClient.post(`/preguntas/${preguntaId}/favorite`);
    return response.data;
  },

  async getAll(params) {
    const response = await apiClient.get('/preguntas/favorites', { params });
    return response.data;
  },

  async check(preguntaId) {
    const response = await apiClient.get(`/preguntas/${preguntaId}/favorite`);
    return response.data;
  },
};

export const ankiService = {
  async updateQuestionGrade(preguntaId, grade) {
    const response = await apiClient.post(`/anki/preguntas/${preguntaId}/grade`, { grade });
    return response.data;
  },

  async getDueQuestions(temasIds) {
    const response = await apiClient.get('/anki/preguntas/due', {
      params: { temasIds },
    });
    return response.data;
  },

  async getStatsByOposicion(oposicionId) {
    const response = await apiClient.get(`/anki/oposiciones/${oposicionId}/stats`);
    return response.data;
  },

  async getStatsByTema(temaId) {
    const response = await apiClient.get(`/anki/temas/${temaId}/stats`);
    return response.data;
  },

  async batchUpdateGrades(updates) {
    const response = await apiClient.post('/anki/batch-update', { updates });
    return response.data;
  },
};

export const maintenanceService = {
  async downloadDbBackup() {
    const response = await apiClient.get('/maintenance/db-backup', {
      responseType: 'blob',
    });
    return response;
  },

  async restoreDbBackup(file) {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await apiClient.post('/maintenance/db-restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
