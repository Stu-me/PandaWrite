const { z } = require('zod');

const userInputValidator = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
});

const userLoginValidator = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

const loginOtpRequestValidator = z.object({
    email: z.string().email(),
});

const loginOtpVerifyValidator = z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/, 'OTP must contain exactly 6 digits'),
    rememberMe: z.boolean().optional(),
});

module.exports = {
    userInputValidator,
    userLoginValidator,
    loginOtpRequestValidator,
    loginOtpVerifyValidator,
};