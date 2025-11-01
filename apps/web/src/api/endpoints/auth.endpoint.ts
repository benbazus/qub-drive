import { useAuthStore } from '@/stores/authStore';
import {
    User,
    AuthTokens,
    LoginCredentials,
    AuthResponse,
} from '@/types/auth';
import { apiClient } from '../api.client';

// Registration flow types
interface StartRegistrationRequest {
    email: string;
}

interface StartRegistrationResponse {
    flowId: string;
    expiresAt: string;
    nextStep: 'verify_email';
    message: string;
}

interface VerifyEmailRequest {
    email: string;
    otp: string;
}

interface VerifyEmailResponse {
    success: boolean;
    nextStep?: 'complete_registration';
    message: string;
}

interface CompleteRegistrationRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
}

interface CompleteRegistrationResponse {
    user: User;
    message: string;
}

// Password reset flow types
interface RequestPasswordResetRequest {
    email: string;
}

interface RequestPasswordResetResponse {
    resetId?: string;
    expiresAt?: string;
    nextStep?: 'verify_otp';
    message: string;
}

interface ResetPasswordWithOtpRequest {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}

interface ResetPasswordWithOtpResponse {
    success: boolean;
    message: string;
}

interface RegistrationStatus {
    step: 'EMAIL_PENDING' | 'OTP_PENDING' | 'DETAILS_PENDING' | 'COMPLETED';
    email: string;
    expiresAt: string;
}

interface ResetStatus {
    email: string;
    isActive: boolean;
    expiresAt: string;
}

class AuthEndPoint {
    private readonly endpoints = {
        // Basic auth
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        profile: '/auth/profile',
        changePassword: '/auth/change-password',

        // Registration flow
        registrationStart: '/registration/start',
        registrationVerifyEmail: '/registration/verify-email',
        registrationComplete: '/registration/complete',
        registrationResendOtp: '/registration/resend-otp',
        registrationStatus: '/registration/status',

        passwordResetVerifyOtp: '/registration/password-reset/verify-otp',
        passwordResetReset: '/registration/password-reset/reset',
        passwordResetResendOtp: '/registration/password-reset/resend-otp',
        passwordResetStatus: '/registration/password-reset/status',




        registerStepOne: '/auth/registration/step-one',
        registerStepTwo: '/auth/registration/step-two',
        registerStepThree: '/auth/registration/step-three',
        resendOtp: '/auth/registration/step-three',


        // Password reset flow
        forgotPasswordStepOne: '/auth/forgot-password/step-one',
        forgotPasswordStepTwo: '/auth/forgot-password/step-two',
        forgotPasswordStepThree: '/auth/forgot-password/step-three',
        resendPasswordResetOtp: '/auth/forgot-password/step-three',


    };


    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<{ data: AuthResponse }>(this.endpoints.login, credentials);
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Login failed');
            }

            const authData = response.data.data;
            console.log('Login successful, setting auth data:', {
                userId: authData.user.id,
                userExp: authData.user.exp,
                hasToken: !!authData.tokens.accessToken,
                currentTime: Math.floor(Date.now() / 1000)
            });

            const { setUser, setAccessToken } = useAuthStore.getState();
            setUser(authData.user);
            setAccessToken(authData.tokens.accessToken);

            return authData;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Start registration process with email
     */
    async startRegistration(request: StartRegistrationRequest): Promise<StartRegistrationResponse> {
        try {
            const response = await apiClient.post<{ data: StartRegistrationResponse }>(
                this.endpoints.registrationStart,
                request
            );
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Failed to start registration');
            }

            return response.data.data;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Verify email with OTP for registration
     */
    async verifyRegistrationEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
        try {
            const response = await apiClient.post<VerifyEmailResponse>(
                this.endpoints.registrationVerifyEmail,
                request
            );
            if (response.error) {
                throw new Error(response.error || 'Email verification failed');
            }

            return response.data!;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Complete registration with user details
     */
    async completeRegistration(request: CompleteRegistrationRequest): Promise<CompleteRegistrationResponse> {
        try {
            const response = await apiClient.post<{ data: CompleteRegistrationResponse }>(
                this.endpoints.registrationComplete,
                request
            );
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Registration completion failed');
            }

            return response.data.data;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Resend registration OTP
     */
    async resendRegistrationOtp(email: string): Promise<{ expiresAt: string; message: string }> {
        try {
            const response = await apiClient.post<{ data: { expiresAt: string }; message: string }>(
                this.endpoints.registrationResendOtp,
                { email }
            );
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Failed to resend OTP');
            }

            return {
                expiresAt: response.data.data.expiresAt,
                message: response.data.message || 'OTP sent successfully'
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    /**
     * Get registration status
     */
    async getRegistrationStatus(email: string): Promise<RegistrationStatus | null> {
        try {
            const response = await apiClient.get<{ data: { status: RegistrationStatus | null } }>(
                `${this.endpoints.registrationStatus}?email=${encodeURIComponent(email)}`
            );
            if (response.error) {
                throw new Error(response.error || 'Failed to get registration status');
            }

            return response.data?.data?.status || null;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async requestPasswordReset(request: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
        try {
            const response = await apiClient.post<{ data: RequestPasswordResetResponse }>(
                this.endpoints.forgotPasswordStepOne,
                request
            );
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Failed to request password reset');
            }

            return response.data.data;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async verifyResetOtp(email: string, otp: string): Promise<{ success: boolean; validFor?: number; message: string }> {
        try {
            const response = await apiClient.post<{
                success: boolean;
                data?: { validFor: number };
                message: string
            }>(
                this.endpoints.passwordResetVerifyOtp,
                { email, otp }
            );
            if (response.error) {
                throw new Error(response.error || 'OTP verification failed');
            }

            return {
                success: response.data?.success || false,
                validFor: response.data?.data?.validFor,
                message: response.data?.message || 'OTP verification result'
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async resetPasswordWithOtp(request: ResetPasswordWithOtpRequest): Promise<ResetPasswordWithOtpResponse> {
        try {
            const response = await apiClient.post<ResetPasswordWithOtpResponse>(
                this.endpoints.passwordResetReset,
                request
            );
            if (response.error) {
                throw new Error(response.error || 'Password reset failed');
            }

            return response.data!;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async resendResetOtp(email: string): Promise<{ expiresAt: string; message: string }> {
        try {
            const response = await apiClient.post<{ data: { expiresAt: string }; message: string }>(
                this.endpoints.passwordResetResendOtp,
                { email }
            );
            if (response.error || !response.data?.data) {
                throw new Error(response.error || 'Failed to resend reset OTP');
            }

            return {
                expiresAt: response.data.data.expiresAt,
                message: response.data.message || 'Reset OTP sent successfully'
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async getResetStatus(email: string): Promise<ResetStatus | null> {
        try {
            const response = await apiClient.get<{ data: { status: ResetStatus | null } }>(
                `${this.endpoints.passwordResetStatus}?email=${encodeURIComponent(email)}`
            );
            if (response.error) {
                throw new Error(response.error || 'Failed to get reset status');
            }

            return response.data?.data?.status || null;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post(this.endpoints.logout);
        } catch (error) {
            console.warn('Server logout failed:', error);
        } finally {
            useAuthStore.getState().reset();
        }
    }

    async getCurrentUser(): Promise<User> {
        try {
            const response = await apiClient.get<{ data: { user: User } }>(this.endpoints.profile);
            if (response.error || !response.data?.data?.user) {
                throw new Error(response.error || 'Failed to fetch user profile');
            }

            const user = response.data.data.user;
            useAuthStore.getState().setUser(user);
            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async refreshTokens(): Promise<AuthTokens> {
        try {
            const response = await apiClient.post<{ data: { tokens: AuthTokens } }>(this.endpoints.refresh);
            if (response.error || !response.data?.data?.tokens) {
                throw new Error(response.error || 'Token refresh failed');
            }

            const tokens = response.data.data.tokens;
            apiClient.updateTokens(tokens);
            return tokens;
        } catch (error) {
            useAuthStore.getState().reset();
            throw this.handleAuthError(error);
        }
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            const response = await apiClient.post(this.endpoints.changePassword, {
                currentPassword,
                newPassword,
            });
            if (response.error) {
                throw new Error(response.error || 'Password change failed');
            }
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    isAuthenticated(): boolean {
        const { user, isTokenExpired } = useAuthStore.getState();
        return !!(user && !isTokenExpired());
    }

    /**
     * Get stored user data
     */
    getStoredUser(): User | null {
        return useAuthStore.getState().user;
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(resource: string, action: string): boolean {
        const user = this.getStoredUser();
        if (!user || !user.permissions) return false;
        return user.permissions.some(
            (permission) => permission.resource === resource && permission.action === action,
        );
    }

    /**
     * Check if user has specific role
     */
    hasRole(roleName: string): boolean {
        const user = this.getStoredUser();
        return user?.role.includes(roleName) ?? false;
    }

    /**
     * Check if user has minimum role level
     */
    hasMinimumRoleLevel(level: number): boolean {
        const user = this.getStoredUser();
        return (user?.roleLevel ?? 0) >= level;
    }

    // Private helper methods
    private handleAuthError(error: any): Error {
        if (error?.status === 401) {
            useAuthStore.getState().reset();
        }
        return error instanceof Error ? error : new Error(error?.message || 'Authentication error');
    }


}

// Create and export singleton instance
export const authEndPoint = new AuthEndPoint();
export default authEndPoint;

// Export types for use in components
export type {
    StartRegistrationRequest,
    StartRegistrationResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    CompleteRegistrationRequest,
    CompleteRegistrationResponse,
    RequestPasswordResetRequest,
    RequestPasswordResetResponse,
    ResetPasswordWithOtpRequest,
    ResetPasswordWithOtpResponse,
    RegistrationStatus,
    ResetStatus,
};