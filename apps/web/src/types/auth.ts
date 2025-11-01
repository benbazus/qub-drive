// types/auth.ts
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
       permissions: Permission[];
    avatar?: string;
    isEmailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    role: string[]; // Array of role names (e.g., ['admin', 'user'])
    exp: number; // Unix timestamp in seconds
    //permissions?: { resource: string; action: string }[]; // Optional for permission checks
    roleLevel?: number; // Optional for role level checks
}



export interface UserRole {
    id: string;
    name: string;
    displayName: string;
    level: number;
}

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    tokenType: 'Bearer';
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    confirmPassword: string;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
    message?: string;
}

export interface AuthError {
    code: string;
    message: string;
    field?: string;
}

export interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: AuthError | null;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    errors?: AuthError[];
}

export interface ApiError {
    status: number;
    code: string;
    message: string;
    errors?: AuthError[];
}

//================================

