import api from '../api/axios'

export const pageService = {
  getAll: (workspaceId) => api.get('/api/pages', { params: workspaceId ? { workspaceId } : {} }),
  getStarred: () => api.get('/api/pages', { params: { starred: 'true' } }),
  getById: (id) => api.get(`/api/pages/${id}`),
  create: (data) => api.post('/api/pages', data),
  update: (id, data) => api.put(`/api/pages/${id}`, data),
  toggleStar: (id) => api.patch(`/api/pages/${id}/star`),
  toggleSharing: (id) => api.patch(`/api/pages/${id}/share`),
  getPublicBlogs: () => api.get('/api/pages/public'),
  getPublicBlog: (id) => api.get(`/api/pages/public/${id}`),
  delete: (id) => api.delete(`/api/pages/${id}`),
}
