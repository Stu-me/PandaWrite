import api from '../api/axios'

// Uploads a short browser recording and returns the permanent URL stored by the audio block.
export const uploadService = {
  uploadAudio: (audioData, mimeType) => api.post('/api/uploads/audio', { audioData, mimeType }),
  uploadImage: (fileData, mimeType, fileName) => api.post('/api/uploads/image', { fileData, mimeType, fileName }),
  uploadDocument: (fileData, mimeType, fileName) => api.post('/api/uploads/document', { fileData, mimeType, fileName }),
}
