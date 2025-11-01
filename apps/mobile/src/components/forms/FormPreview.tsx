import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { Form, FormField, FormFieldType, FieldValue } from "@/types/forms";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface FormPreviewProps {
  form: Form;
  onSubmit?: (responses: Record<string, FieldValue>) => void;
  onClose?: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  form,
  onSubmit,
  onClose,
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !responses[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }

        const value = responses[field.id];
        if (value && field.validation) {
          // Text length validation
          if (
            field.validation.minLength &&
            value.length < field.validation.minLength
          ) {
            newErrors[
              field.id
            ] = `Minimum length is ${field.validation.minLength} characters`;
          }
          if (
            field.validation.maxLength &&
            value.length > field.validation.maxLength
          ) {
            newErrors[
              field.id
            ] = `Maximum length is ${field.validation.maxLength} characters`;
          }

          // Number validation
          if (field.fieldType === FormFieldType.Number) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              newErrors[field.id] = "Please enter a valid number";
            } else {
              if (
                field.validation.minValue &&
                numValue < field.validation.minValue
              ) {
                newErrors[
                  field.id
                ] = `Minimum value is ${field.validation.minValue}`;
              }
              if (
                field.validation.maxValue &&
                numValue > field.validation.maxValue
              ) {
                newErrors[
                  field.id
                ] = `Maximum value is ${field.validation.maxValue}`;
              }
            }
          }

          // Email validation
          if (field.fieldType === FormFieldType.Email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              newErrors[field.id] = "Please enter a valid email address";
            }
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit?.(responses);
    }
  };

  const renderField = (field: FormField) => {
    const value = responses[field.id] || "";
    const error = errors[field.id];

    switch (field.fieldType) {
      case FormFieldType.ShortText:
      case FormFieldType.Email:
      case FormFieldType.Phone:
        return (
          <Input
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            error={error}
            keyboardType={
              field.fieldType === FormFieldType.Email
                ? "email-address"
                : field.fieldType === FormFieldType.Phone
                ? "phone-pad"
                : "default"
            }
          />
        );

      case FormFieldType.LongText:
        return (
          <Input
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            error={error}
            multiline
            numberOfLines={4}
          />
        );

      case FormFieldType.Number:
        return (
          <Input
            key={field.id}
            label={field.label}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder || "0"}
            error={error}
            keyboardType="numeric"
          />
        );

      case FormFieldType.MultipleChoice:
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {field.description && (
              <Text style={styles.fieldDescription}>{field.description}</Text>
            )}
            <View style={styles.optionsContainer}>
              {field.options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.radioOption}
                  onPress={() => handleFieldChange(field.id, option.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      value === option.value
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      value === option.value
                        ? Colors.light.tint
                        : Colors.light.tabIconDefault
                    }
                  />
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case FormFieldType.Checkboxes:
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {field.description && (
              <Text style={styles.fieldDescription}>{field.description}</Text>
            )}
            <View style={styles.optionsContainer}>
              {field.options.map((option) => {
                const selectedValues = Array.isArray(value) ? value : [];
                const isSelected = selectedValues.includes(option.value);

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.checkboxOption}
                    onPress={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v) => v !== option.value)
                        : [...selectedValues, option.value];
                      handleFieldChange(field.id, newValues);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={
                        isSelected
                          ? Colors.light.tint
                          : Colors.light.tabIconDefault
                      }
                    />
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case FormFieldType.LinearScale:
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {field.description && (
              <Text style={styles.fieldDescription}>{field.description}</Text>
            )}
            <View style={styles.scaleContainer}>
              <Text style={styles.scaleLabel}>
                {field.properties.scaleMinLabel || field.properties.scaleMin}
              </Text>
              <View style={styles.scaleOptions}>
                {Array.from(
                  {
                    length:
                      (field.properties.scaleMax || 5) -
                      (field.properties.scaleMin || 1) +
                      1,
                  },
                  (_, i) => {
                    const scaleValue = (field.properties.scaleMin || 1) + i;
                    return (
                      <TouchableOpacity
                        key={scaleValue}
                        style={[
                          styles.scaleOption,
                          value === scaleValue && styles.selectedScaleOption,
                        ]}
                        onPress={() => handleFieldChange(field.id, scaleValue)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.scaleOptionText,
                            value === scaleValue &&
                              styles.selectedScaleOptionText,
                          ]}
                        >
                          {scaleValue}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
              <Text style={styles.scaleLabel}>
                {field.properties.scaleMaxLabel || field.properties.scaleMax}
              </Text>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );

      case FormFieldType.SectionBreak:
        return (
          <View key={field.id} style={styles.sectionBreak}>
            <View style={styles.sectionBreakLine} />
          </View>
        );

      default:
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.unsupportedField}>
              This field type is not supported in preview mode
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{form.title}</Text>
          {form.description && (
            <Text style={styles.description}>{form.description}</Text>
          )}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContent}>
          {form.sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.description && (
                <Text style={styles.sectionDescription}>
                  {section.description}
                </Text>
              )}
              <View style={styles.sectionFields}>
                {section.fields.map(renderField)}
              </View>
            </View>
          ))}

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Submit Form"
              onPress={handleSubmit}
              style={styles.submitButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + "20",
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
    lineHeight: 22,
  },
  sectionFields: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  fieldDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
    lineHeight: 18,
  },
  optionsContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  scaleContainer: {
    alignItems: "center",
  },
  scaleOptions: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  scaleOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.tabIconDefault + "30",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  selectedScaleOption: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint,
  },
  scaleOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  selectedScaleOptionText: {
    color: Colors.light.background,
  },
  scaleLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
  },
  sectionBreak: {
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionBreakLine: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.light.tabIconDefault + "30",
  },
  unsupportedField: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontStyle: "italic",
    padding: 16,
    backgroundColor: Colors.light.tabIconDefault + "10",
    borderRadius: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  submitButton: {
    minWidth: 200,
  },
});
