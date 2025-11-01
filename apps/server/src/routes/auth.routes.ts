import authController from '../controllers/auth.controller';
import passwordResetController from '../controllers/password-reset.controller'
import { authenticate } from '../middleware/auth.middleware';
import { Router, Request, Response, NextFunction } from 'express';


const router = Router();

// Wrapper function to convert Express handlers to match controller signatures
const wrapHandler = (controllerMethod: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controllerMethod(req, res);
        } catch (error) {
            next(error);
        }
    };
};

// Express middleware wrapper for authenticate function
const expressAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Convert Express request to AuthenticatedRequest format
        const authReq = req as any;
        const authRes = res as any;

        // Call the authenticate function
        const isAuthenticated = await authenticate(authReq, authRes);

        if (isAuthenticated) {
            next();
        }
        // If not authenticated, the authenticate function will have already sent the error response
    } catch (error) {
        next(error);
    }
};

// Auth routes

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', wrapHandler(authController.login));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', wrapHandler(authController.refreshToken));

/**
 * @swagger
 * /api/auth/registration/start:
 *   post:
 *     summary: Start registration process (Step 1)
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       400:
 *         description: Email already exists
 */
router.post("/registration/start", wrapHandler(authController.registerStepOne));

/**
 * @swagger
 * /api/auth/registration/step-two:
 *   post:
 *     summary: Verify OTP (Step 2)
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/registration/step-two", wrapHandler(authController.registerStepTwo));

/**
 * @swagger
 * /api/auth/registration/step-three:
 *   post:
 *     summary: Complete registration (Step 3)
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Registration failed
 */
router.post("/registration/step-three", wrapHandler(authController.registerStepThree));

/**
 * @swagger
 * /api/auth/registration/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Too many requests
 */
router.post("/registration/resend-otp", wrapHandler(authController.resendOtp));

// Password reset flow

/**
 * @swagger
 * /api/auth/forgot-password/step-one:
 *   post:
 *     summary: Request password reset
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post("/forgot-password/step-one", wrapHandler(authController.forgotPasswordStepOne));
router.post("/forgot-password/step-two", wrapHandler(authController.forgotPasswordStepTwo));
router.post("/forgot-password/step-three", wrapHandler(authController.forgotPasswordStepThree));
router.post("/forgot-password/resend-otp", wrapHandler(authController.resendPasswordResetOtp));

router.post('/password-reset/request', wrapHandler(passwordResetController.requestPasswordReset));

router.post('/password-reset/verify-otp', wrapHandler(passwordResetController.verifyResetOtp));

router.post('/password-reset/reset', wrapHandler(passwordResetController.resetPasswordWithOtp));

router.post('/password-reset/resend-otp', wrapHandler(passwordResetController.resendResetOtp));

router.post('/password-reset/status', wrapHandler(passwordResetController.getResetStatus));

// router.post('/password-reset/request', wrapHandler(authController.login));

// router.post('/password-reset/verify-otp', wrapHandler(authController.login));

// router.post('/password-reset/reset', wrapHandler(authController.login));

// router.post('/password-reset/resend-otp', wrapHandler(authController.login));

// router.post('/password-reset/status', wrapHandler(authController.login));

// router.post('/change-password', wrapHandler(authController.login));

// Protected routes
router.post('/logout', expressAuthenticate, wrapHandler(authController.logout));

router.get('/profile', expressAuthenticate, wrapHandler(authController.getCurrentUser));

router.get('/me', expressAuthenticate, wrapHandler(authController.getCurrentUser));

export default router;