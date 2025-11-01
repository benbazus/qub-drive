declare module 'expo-local-authentication' {
  export interface AuthenticationResult {
    success: boolean;
    error?: string;
    warning?: string;
  }

  export enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2,
    IRIS = 3,
  }

  export interface AuthenticationOptions {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }

  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
  export function authenticateAsync(options?: AuthenticationOptions): Promise<AuthenticationResult>;
}