const express = require('express');
const authMiddleware  = require('../middlewares/authMiddleware')

const router = express.Router();
const {
	registerUser,
	loginUser,
	requestLoginOtp,
	verifyLoginOtp,
	userInfo,
	forgotPassword,
	resetPassword,
} = require('../controllers/authController')
//api/auth
router.post('/register',registerUser);
router.post('/login',loginUser);
router.post('/login/request-otp', requestLoginOtp);
router.post('/login/verify-otp', verifyLoginOtp);
router.get('/me',authMiddleware,userInfo); // we have to use jwt token wherever authmiddleware is used
router.post('/forgotpassword',forgotPassword);
router.put('/resetpassword/:token',resetPassword);
module.exports = router;