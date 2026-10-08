const asyncHandler = require('express-async-handler');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_DOCUMENT_TYPES = new Map([['application/pdf', 'pdf'], ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx']]);

const normalizeMimeType = (value) => value?.split(';')[0]?.trim().toLowerCase();

// Saves a short browser-recorded audio clip locally and returns a URL suitable for an audio block.
const uploadAudio = asyncHandler(async (req, res) => {
  const { audioData } = req.body;
  const mimeType = normalizeMimeType(req.body?.mimeType);

  if (!audioData || !mimeType || !ALLOWED_AUDIO_TYPES.has(mimeType)) {
    res.status(400);
    throw new Error('A supported audio recording is required');
  }

  const base64Match = audioData.match(/^data:[^,]+;base64,(.+)$/i);
  const encodedAudio = base64Match ? base64Match[1] : audioData;
  const buffer = Buffer.from(encodedAudio, 'base64');
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
    res.status(400);
    throw new Error('Audio must be between 1 byte and 3 MB');
  }

  const extension = mimeType === 'audio/mpeg' ? 'mp3' : mimeType === 'audio/mp4' ? 'm4a' : mimeType === 'audio/ogg' ? 'ogg' : 'webm';
  const uploadsDirectory = path.join(__dirname, '..', 'uploads', 'audio');
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), buffer);

  // Local storage is appropriate for development; use cloud object storage before multi-server production deployment.
  return res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/audio/${filename}` });
});

const saveBase64Upload = async ({ data, mimeType, allowedTypes, maxBytes, directory, extension, originalName }) => {
  const normalizedType = normalizeMimeType(mimeType);
  if (!data || !normalizedType || !allowedTypes.has(normalizedType)) {
    const error = new Error('Unsupported file type'); error.statusCode = 400; throw error;
  }
  const encoded = data.match(/^data:[^,]+;base64,(.+)$/i)?.[1] || data;
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.length > maxBytes) {
    const error = new Error(`File must be between 1 byte and ${maxBytes / 1024 / 1024} MB`); error.statusCode = 400; throw error;
  }
  const uploadsDirectory = path.join(__dirname, '..', 'uploads', directory);
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), buffer);
  return { filename, mimeType: normalizedType, originalName: path.basename(originalName || `upload.${extension}`) };
};

const uploadImage = asyncHandler(async (req, res) => {
  const mimeType = normalizeMimeType(req.body?.mimeType);
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mimeType];
  const upload = await saveBase64Upload({ data: req.body?.fileData, mimeType, allowedTypes: ALLOWED_IMAGE_TYPES, maxBytes: MAX_IMAGE_BYTES, directory: 'images', extension, originalName: req.body?.fileName });
  return res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/images/${upload.filename}` });
});

const uploadDocument = asyncHandler(async (req, res) => {
  const mimeType = normalizeMimeType(req.body?.mimeType);
  const extension = ALLOWED_DOCUMENT_TYPES.get(mimeType);
  const upload = await saveBase64Upload({ data: req.body?.fileData, mimeType, allowedTypes: new Set(ALLOWED_DOCUMENT_TYPES.keys()), maxBytes: MAX_DOCUMENT_BYTES, directory: 'documents', extension, originalName: req.body?.fileName });
  return res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/documents/${upload.filename}`, name: upload.originalName, mimeType: upload.mimeType });
});

module.exports = { uploadAudio, uploadImage, uploadDocument };
