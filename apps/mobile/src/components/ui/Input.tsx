import React, { forwardRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | undefined;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerStyle,
      labelStyle,
      inputStyle,
      errorStyle,
      ...props
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[styles.input, error && styles.inputError, inputStyle]}
          placeholderTextColor={Colors.light.tabIconDefault}
          accessibilityState={{ disabled: false }}
          {...props}
        />
        {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    fontSize: 14,
    color: "#ef4444",
    marginTop: 4,
  },
});
