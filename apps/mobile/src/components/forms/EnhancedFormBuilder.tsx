import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/theme";
import type { Form, FormFieldType } from "@/types/forms";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import { FormManagement } from "./FormManagement";
import { FormVersionHistory } from "./FormVersionHistory";
import { FieldPalette } from "./FieldPalette";
import { FormCanvas } from "./FormCanvas";
import { FieldPropertiesPanel } from "./FieldPropertiesPanel";
import { FormBuilderToolbar } from "./FormBuilderToolbar";

interface EnhancedFormBuilderProps {
  formId?: string;
  onSave?: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
}

type ViewMode = "builder" | "management" | "versions";

const { width: screenWidth } = Dimensions.get("window");
const PANEL_WIDTH = screenWidth * 0.3;
const MIN_PANEL_WIDTH = 280;

export const EnhancedFormBuilder: React.FC<EnhancedFormBuilderProps> = ({
  formId,
  onSave,
  onPublish,
  onPreview,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("builder");
  const [showFieldPalette, setShowFieldPalette] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  const {
    form,
    selectedField,
    selectedSection,
    previewMode,
    unsavedChanges,
    loading,
    error,
    saveForm,
    addSection,
    updateSection,
    deleteSection,
    addField,
    updateField,
    deleteField,
    duplicateField,
    selectField,
    selectSection,
    togglePreviewMode,
    validateForm,
    publishForm,
    getShareLink,
    fieldTemplates,
    loadForm,
  } = useFormBuilder(formId);

  const handleFieldSelect = (fieldType: FormFieldType) => {
    if (!form || form.sections.length === 0) {
      Alert.alert(
        "No Section",
        "Please add a section first before adding fields."
      );
      return;
    }

    // Add field to the first section or selected section
    const targetSection = selectedSection || form.sections[0];
    if (targetSection) {
      addField(targetSection.id, fieldType);
      setShowPropertiesPanel(true);
    }
  };

  const handleFieldSelectFromCanvas = (field: any) => {
    selectField(field);
    setShowPropertiesPanel(true);
  };

  const handleSectionSelectFromCanvas = (section: any) => {
    selectSection(section);
    setShowPropertiesPanel(true);
  };

  const handleSave = async () => {
    try {
      await saveForm();
      onSave?.();
      Alert.alert("Success", "Form saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save form. Please try again.");
    }
  };

  const handlePublish = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert(
        "Validation Errors",
        `Please fix the following issues:\n\n${errors.join("\n")}`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      await publishForm();
      onPublish?.();
      Alert.alert("Success", "Form published successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to publish form. Please try again.");
    }
  };

  const handlePreview = () => {
    togglePreviewMode();
    onPreview?.();
  };

  const handleShare = async () => {
    if (!form) return;

    try {
      const shareData = await getShareLink();
      if (shareData) {
        Alert.alert(
          "Share Form",
          `Share this link with others:\n\n${shareData.url}`,
          [
            {
              text: "Copy Link",
              onPress: () => {
                Alert.alert("Copied", "Link copied to clipboard!");
              },
            },
            { text: "Close", style: "cancel" },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get share link. Please try again.");
    }
  };

  const handleCloseProperties = () => {
    setShowPropertiesPanel(false);
    selectField(null);
    selectSection(null);
  };

  const handleFormSelect = async (selectedForm: Form) => {
    await loadForm(selectedForm.id);
    setViewMode("builder");
  };

  const handleFormCreate = async (newForm: Form) => {
    await loadForm(newForm.id);
    setViewMode("builder");
  };

  const handleFormRestore = async (restoredForm: Form) => {
    await loadForm(restoredForm.id);
    setViewMode("builder");
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (unsavedChanges && mode !== "builder") {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before switching views?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => setViewMode(mode),
          },
          {
            text: "Save",
            onPress: async () => {
              try {
                await saveForm();
                setViewMode(mode);
              } catch (error) {
                Alert.alert("Error", "Failed to save form");
              }
            },
          },
        ]
      );
    } else {
      setViewMode(mode);
    }
  };

  const panelWidth = Math.max(PANEL_WIDTH, MIN_PANEL_WIDTH);
  const canvasWidth =
    screenWidth -
    (showFieldPalette ? panelWidth : 0) -
    (showPropertiesPanel ? panelWidth : 0);

  // Render view mode selector
  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === "builder" && styles.activeViewMode,
        ]}
        onPress={() => handleViewModeChange("builder")}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === "builder" && styles.activeViewModeText,
          ]}
        >
          Builder
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === "management" && styles.activeViewMode,
        ]}
        onPress={() => handleViewModeChange("management")}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === "management" && styles.activeViewModeText,
          ]}
        >
          Management
        </Text>
      </TouchableOpacity>
      {form && (
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "versions" && styles.activeViewMode,
          ]}
          onPress={() => handleViewModeChange("versions")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "versions" && styles.activeViewModeText,
            ]}
          >
            Versions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Content based on view mode */}
      {viewMode === "management" && (
        <FormManagement
          onFormSelect={handleFormSelect}
          onFormCreate={handleFormCreate}
        />
      )}

      {viewMode === "versions" && form && (
        <FormVersionHistory form={form} onFormRestore={handleFormRestore} />
      )}

      {viewMode === "builder" && (
        <>
          {/* Toolbar */}
          <FormBuilderToolbar
            form={form}
            previewMode={previewMode}
            unsavedChanges={unsavedChanges}
            loading={loading}
            onSave={handleSave}
            onPublish={handlePublish}
            onPreview={handlePreview}
            onShare={handleShare}
            onToggleFieldPalette={() => setShowFieldPalette(!showFieldPalette)}
            onTogglePropertiesPanel={() =>
              setShowPropertiesPanel(!showPropertiesPanel)
            }
            showFieldPalette={showFieldPalette}
            showPropertiesPanel={showPropertiesPanel}
          />

          <View style={styles.builderContent}>
            {/* Field Palette */}
            {showFieldPalette && (
              <View style={[styles.panel, { width: panelWidth }]}>
                <FieldPalette
                  fieldTemplates={fieldTemplates}
                  onFieldSelect={handleFieldSelect}
                />
              </View>
            )}

            {/* Form Canvas */}
            <View style={[styles.canvas, { width: canvasWidth }]}>
              {form ? (
                <FormCanvas
                  form={form}
                  selectedField={selectedField}
                  selectedSection={selectedSection}
                  previewMode={previewMode}
                  onFieldSelect={handleFieldSelectFromCanvas}
                  onSectionSelect={handleSectionSelectFromCanvas}
                  onFieldUpdate={updateField}
                  onFieldDelete={deleteField}
                  onFieldDuplicate={duplicateField}
                  onSectionUpdate={updateSection}
                  onSectionDelete={deleteSection}
                  onAddSection={addSection}
                  onFieldReorder={(sectionId, fromIndex, toIndex) => {
                    console.log(
                      "Reorder fields:",
                      sectionId,
                      fromIndex,
                      toIndex
                    );
                  }}
                />
              ) : (
                <View style={styles.noFormContainer}>
                  <Text style={styles.noFormText}>
                    No form selected. Go to Management to create or select a
                    form.
                  </Text>
                  <TouchableOpacity
                    style={styles.createFormButton}
                    onPress={() => setViewMode("management")}
                  >
                    <Text style={styles.createFormButtonText}>
                      Go to Management
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Properties Panel */}
            {showPropertiesPanel && form && (
              <View style={[styles.panel, { width: panelWidth }]}>
                <FieldPropertiesPanel
                  field={selectedField}
                  section={selectedSection}
                  onFieldUpdate={updateField}
                  onSectionUpdate={updateSection}
                  onClose={handleCloseProperties}
                />
              </View>
            )}
          </View>
        </>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  viewModeSelector: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + "20",
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeViewMode: {
    borderBottomColor: Colors.light.tint,
  },
  viewModeText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  activeViewModeText: {
    color: Colors.light.tint,
    fontWeight: "600",
  },
  builderContent: {
    flex: 1,
    flexDirection: "row",
  },
  panel: {
    borderRightWidth: 1,
    borderRightColor: Colors.light.tabIconDefault + "20",
    backgroundColor: Colors.light.background,
  },
  canvas: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  noFormContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noFormText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginBottom: 20,
  },
  createFormButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFormButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorText: {
    color: Colors.light.background,
    fontSize: 14,
    textAlign: "center",
  },
});
