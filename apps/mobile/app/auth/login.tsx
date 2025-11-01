import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthContext } from "@/providers/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { validateLoginForm, ValidationErrors } from "@/utils/validation";
import { BiometricAuthService } from "@/services/auth/biometricAuth";

export default function LoginScreen() {
  const { login, authenticateWithBiometric, biometricEnabled, isLoading } =
    useAuthContext();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Check biometric availability on mount
  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await BiometricAuthService.isAvailable();
    setBiometricAvailable(available);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async () => {
    try {
      // Validate form
      const validationErrors = validateLoginForm(
        formData.email,
        formData.password
      );
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      await login(formData.email, formData.password);

      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error: unknown) {
      console.error("Login error:", error);

      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Please check your credentials and try again.";
      Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!biometricEnabled) {
        Alert.alert(
          "Biometric Not Enabled",
          "Please enable biometric authentication in settings first.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await authenticateWithBiometric();
      if (result.success) {
        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate to main app
        router.replace("/(tabs)");
      } else {
        // Error haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        Alert.alert(
          "Authentication Failed",
          result.error || "Biometric authentication failed. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Biometric login error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const navigateToRegister = () => {
    router.push("/auth/register");
  };

  const navigateToForgotPassword = () => {
    router.push("/auth/forgot-password");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Qub Drive account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email}
            accessibilityLabel="Email address input"
            accessibilityHint="Enter your email address to sign in"
          />

          <Input
            ref={passwordRef}
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            error={errors.password}
            accessibilityLabel="Password input"
            accessibilityHint="Enter your password to sign in"
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={navigateToForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
            accessibilityLabel="Sign in button"
            accessibilityHint="Tap to sign in to your account"
          />

          {biometricAvailable && biometricEnabled && (
            <Button
              title="Sign In with Biometrics"
              onPress={handleBiometricLogin}
              variant="outline"
              style={styles.biometricButton}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={navigateToRegister}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const isTablet = screenWidth >= 768
const isSmallScreen = screenHeight < 700

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: isSmallScreen ? "flex-start" : "center",
    padding: isTablet ? 48 : 24,
    paddingTop: isSmallScreen ? 60 : 24,
  },
  header: {
    alignItems: "center",
    marginBottom: isSmallScreen ? 24 : 32,
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: isTablet ? 32 : isSmallScreen ? 24 : 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: isTablet ? 24 : 22,
  },
  form: {
    marginBottom: isSmallScreen ? 24 : 32,
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  loginButton: {
    marginBottom: 16,
  },
  biometricButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  footerLink: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: "600",
  },
});
