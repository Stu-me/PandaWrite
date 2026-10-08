const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs'); // good for deployement 
const crypto = require('crypto'); 
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/sendEmail')
const {
    userInputValidator,
    userLoginValidator,
    loginOtpRequestValidator,
    loginOtpVerifyValidator,
} = require('../middlewares/userValidator');
const remeberTime = '30m'

const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000;
const LOGIN_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const LOGIN_OTP_MAX_ATTEMPTS = 5;

// will put in utility folder after checking the flow 

// Creates a short session by default or a longer trusted-device session for Remember Me.
const generateToken = (id, expiresIn = remeberTime)=>{
    return jwt.sign(
        {id},                       // payload
        process.env.JWT_SECRET,     // secret signature 
        {expiresIn}
    )
}


//@desc register new user
//@route POST /register
//@access public

const registerUser = asyncHandler(async(req,res)=>{
    const validUser = userInputValidator.parse(req.body);
    const {name, email , password} = validUser;
    const emailExists = await User.findOne({email});

    if(emailExists){
        res.status(400);
        throw new Error(`the email is registred ${emailExists.name}`);
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = await User.create({
        name:name,
        email:email,
        password:hashedPassword
    });

    res.status(201).json({
        _id:newUser._id,
        name:name,
        email:email,
        role: newUser.role,
        token:generateToken(newUser._id)
    });
});


//@desc login  user
//@route POST /login
//@access public

const loginUser = asyncHandler(async(req,res)=>{
    const validInput = userLoginValidator.parse(req.body);

    const {email , password} = validInput;

    const validUser= await User.findOne({email:email});

    if(!validUser){
        res.status(401);
        throw new Error('Invalid email Id');
    }
    const isMatch = await bcrypt.compare(password,validUser.password)
    if(!isMatch){
        res.status(400);
        throw new Error('invalid credentials');
    }
    
    // Only a literal true enables the longer session; client input cannot change roles or permissions.
    const token = generateToken(validUser._id, req.body.rememberMe === true ? '30d' : remeberTime);
    res.status(200).json({
        _id:validUser._id,
        name:validUser.name,
        email:validUser.email,
        role: validUser.role,
        token
    });
});

// Sends a short-lived login code without revealing whether the email exists.
const requestLoginOtp = asyncHandler(async (req, res) => {
    const { email } = loginOtpRequestValidator.parse(req.body);
    const user = await User.findOne({ email });

    if (user) {
        const now = Date.now();
        const lastRequestedAt = user.loginOtpRequestedAt?.getTime() || 0;

        if (now - lastRequestedAt < LOGIN_OTP_RESEND_COOLDOWN_MS) {
            // Keep the response identical for known and unknown email addresses.
            return res.status(200).json({
                message: 'If an account exists for that email, a login code has been sent.',
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.loginOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
        user.loginOtpExpires = new Date(now + LOGIN_OTP_EXPIRY_MS);
        user.loginOtpAttempts = 0;
        user.loginOtpRequestedAt = new Date(now);
        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your Pandawrite login code',
                text: `Your Pandawrite login code is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your Pandawrite login code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
            });
        } catch (error) {
            // Do not leave a usable OTP behind when delivery fails.
            user.loginOtpHash = undefined;
            user.loginOtpExpires = undefined;
            user.loginOtpAttempts = 0;
            user.loginOtpRequestedAt = undefined;
            await user.save();
            throw error;
        }
    }

    res.status(200).json({
        message: 'If an account exists for that email, a login code has been sent.',
    });
});

// Verifies the code and issues the same JWT returned by password login.
const verifyLoginOtp = asyncHandler(async (req, res) => {
    const { email, otp, rememberMe } = loginOtpVerifyValidator.parse(req.body);
    const user = await User.findOne({ email });

    if (!user || !user.loginOtpHash || !user.loginOtpExpires) {
        res.status(401);
        throw new Error('Invalid or expired login code.');
    }

    if (user.loginOtpExpires.getTime() <= Date.now()) {
        user.loginOtpHash = undefined;
        user.loginOtpExpires = undefined;
        user.loginOtpAttempts = 0;
        await user.save();
        res.status(401);
        throw new Error('Invalid or expired login code.');
    }

    if (user.loginOtpAttempts >= LOGIN_OTP_MAX_ATTEMPTS) {
        res.status(429);
        throw new Error('Too many incorrect attempts. Request a new login code.');
    }

    user.loginOtpAttempts += 1;
    const submittedOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const isValidOtp = crypto.timingSafeEqual(
        Buffer.from(user.loginOtpHash, 'hex'),
        Buffer.from(submittedOtpHash, 'hex')
    );

    if (!isValidOtp) {
        await user.save();
        res.status(401);
        throw new Error('Invalid or expired login code.');
    }

    user.loginOtpHash = undefined;
    user.loginOtpExpires = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpRequestedAt = undefined;
    await user.save();

    const token = generateToken(user._id, rememberMe === true ? '30d' : remeberTime);
    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
    });
});


//@desc Info about the user
//@route GET /me
//@access private

const userInfo = asyncHandler(async(req,res)=>{
    res.status(200).json(req.user); // req.user is formed from the the token we give 
     // we create token and send id in it 
});

//@desc Info about the user
//@route POST /forgotpassword
//@access public

const  forgotPassword = asyncHandler(async(req,res)=>{

    const {email} = req.body; // as he forgot password we take his email
    
    const user = await User.findOne({email});
    // check if valid email
    if(!user){
        res.status(404);
        throw new Error('User not found');
    }

    //generate raw token and it is not stored anywhere in database rather its hashed version is stored for security 
    const resetToken = crypto.randomBytes(32).toString('hex') ;
    
    // hash token (store this)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // save it in database 
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15*60*1000; // user expiry time starts from current to 15 min extra 

    await user.save(); // this line act as user.update() for the user. changes we did 

    //email the token 
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetURL = `${clientUrl}/reset-password/${resetToken}`;
    const message = `
    You requested password reset.
    
    Reset using this link:${resetURL}
    
    link expires in 15 minutes
    `;
    try{
        await sendEmail({
        email:user.email,
        subject: `Password Reset`,
        text:message
    })
    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        
        throw new Error(`Email Failed --${error}`)
    }

    res.status(200).json({
        message:"Reset token generated (check mail)"
    });
    
});

//@desc Info about the user
//@route PUT /resetPassword
//@access public


const resetPassword  = asyncHandler(async(req,res)=>{
    const {password} = req.body;

    if (!password || password.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long');
    }
    
    console.log("yeah working")
    // as we have token we hash it to check if it is same 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // find matching user
    const user = await User.findOne({ // checks if both valid
      resetPasswordToken:hashedToken, // checking for same token 
      resetPasswordExpire:{$gt:Date.now()} // check if the  time is greater than current time
    });

    if(!user){
        res.status(400);
        throw new Error('Invalid or expired token')
    }
    //set new password 
    const hashedNewPassword = await bcrypt.hash(password,10)
    user.password = hashedNewPassword ;

    // clear reset fields so that it could not be used later after password updation
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({
        message: "Password reset successful"
    });
});

module.exports = {
    registerUser,
    loginUser,
    requestLoginOtp,
    verifyLoginOtp,
    userInfo,
    forgotPassword,
    resetPassword,
};
