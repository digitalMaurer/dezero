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
  async bulkUpdateTema(ids, temaId) {
    const response = await apiClient.post('/preguntas/bulk-update-tema', { ids, temaId });
    return response.data;
  },

  async reportQuestion(preguntaId, data) {
    const response = await apiClient.post(`/preguntas/${preguntaId}/report`, data);
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

  async getAttempt(id) {
    const response = await apiClient.get(`/tests/attempts/${id}`);
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
