const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadAudio, uploadImage, uploadDocument } = require('../controllers/uploadController');

const router = express.Router();

router.post('/audio', authMiddleware, uploadAudio);
router.post('/image', authMiddleware, uploadImage);
router.post('/document', authMiddleware, uploadDocument);

module.exports = router;
