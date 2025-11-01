import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
  TextInput,
} from "react-native";
import { Clipboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { Form } from "@/types/forms";
import { formsApi } from "@/services/api/formsApi";

interface FormSharingManagerProps {
  form: Form;
  onClose: () => void;
  onFormUpdate?: (form: Form) => void;
}

interface ShareSettings {
  public: boolean;
  password?: string | undefined;
  allowAnonymous: boolean;
  collectEmails: boolean;
  requireSignIn: boolean;
  expiresAt?: string | undefined;
  responseLimit?: number | undefined;
}

export const FormSharingManager: React.FC<FormSharingManagerProps> = ({
  form,
  onClose,
  onFormUpdate,
}) => {
  const [shareLink, setShareLink] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    public: form.status === "Published",
    allowAnonymous: !form.settings.requireSignIn,
    collectEmails: form.settings.collectEmails,
    requireSignIn: form.settings.requireSignIn,
    expiresAt: form.settings.expiresAt || undefined,
    responseLimit: form.settings.responseLimit || undefined,
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadShareLink();
  }, [form.id]);

  const loadShareLink = async () => {
    try {
      setLoading(true);
      const shareData = await formsApi.getFormShareLink(form.id);
      setShareLink(shareData.url);
      setQrCode(shareData.qrCode);
    } catch (error) {
      Alert.alert("Error", "Failed to load share link");
    } finally {
      setLoading(false);
    }
  };

  const updateShareSettings = async (newSettings: Partial<ShareSettings>) => {
    try {
      setLoading(true);
      const updatedSettings = { ...shareSettings, ...newSettings };
      setShareSettings(updatedSettings);

      await formsApi.updateFormShareSettings(form.id, {
        public: updatedSettings.public,
        ...(updatedSettings.password && { password: updatedSettings.password }),
      });

      // Update form settings
      const formUpdate = await formsApi.updateForm(form.id, {
        settings: {
          ...form.settings,
          requireSignIn: updatedSettings.requireSignIn,
          collectEmails: updatedSettings.collectEmails,
          ...(updatedSettings.expiresAt && {
            expiresAt: updatedSettings.expiresAt,
          }),
          ...(updatedSettings.responseLimit && {
            responseLimit: updatedSettings.responseLimit,
          }),
        },
      });

      onFormUpdate?.(formUpdate);
      Alert.alert("Success", "Share settings updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update share settings");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setString(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const shareForm = async () => {
    try {
      await Share.share({
        message: `Fill out this form: ${form.title}\n\n${shareLink}`,
        url: shareLink,
        title: form.title,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share form");
    }
  };

  const generateNewLink = async () => {
    Alert.alert(
      "Generate New Link",
      "This will invalidate the current link. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // In a real implementation, you would call an API to regenerate the link
              await loadShareLink();
              Alert.alert("Success", "New share link generated");
            } catch (error) {
              Alert.alert("Error", "Failed to generate new link");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Form</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Share Link Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Link</Text>
          <Text style={styles.sectionDescription}>
            Anyone with this link can access your form
          </Text>

          <View style={styles.linkContainer}>
            <TextInput
              style={styles.linkInput}
              value={shareLink}
              editable={false}
              multiline
            />
            <View style={styles.linkActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  copied && styles.actionButtonSuccess,
                ]}
                onPress={copyToClipboard}
                disabled={loading}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy"}
                  size={20}
                  color={copied ? Colors.light.background : Colors.light.tint}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    copied && styles.actionButtonTextSuccess,
                  ]}
                >
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareForm}
                disabled={loading}
              >
                <Ionicons name="share" size={20} color={Colors.light.tint} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={generateNewLink}
            disabled={loading}
          >
            <Ionicons name="refresh" size={16} color={Colors.light.tint} />
            <Text style={styles.regenerateButtonText}>Generate New Link</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        {qrCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Code</Text>
            <Text style={styles.sectionDescription}>
              Let people scan this code to access your form
            </Text>
            <View style={styles.qrCodeContainer}>
              {/* In a real implementation, you would display the QR code image */}
              <View style={styles.qrCodePlaceholder}>
                <Ionicons
                  name="qr-code"
                  size={80}
                  color={Colors.light.tabIconDefault}
                />
                <Text style={styles.qrCodeText}>QR Code</Text>
              </View>
            </View>
          </View>
        )}

        {/* Share Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Access</Text>
              <Text style={styles.settingDescription}>
                Allow anyone with the link to access the form
              </Text>
            </View>
            <Switch
              value={shareSettings.public}
              onValueChange={(value) => updateShareSettings({ public: value })}
              disabled={loading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Sign In</Text>
              <Text style={styles.settingDescription}>
                Users must sign in to fill out the form
              </Text>
            </View>
            <Switch
              value={shareSettings.requireSignIn}
              onValueChange={(value) =>
                updateShareSettings({ requireSignIn: value })
              }
              disabled={loading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Collect Email Addresses</Text>
              <Text style={styles.settingDescription}>
                Automatically collect respondent email addresses
              </Text>
            </View>
            <Switch
              value={shareSettings.collectEmails}
              onValueChange={(value) =>
                updateShareSettings({ collectEmails: value })
              }
              disabled={loading}
            />
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Response Limit</Text>
            <TextInput
              style={styles.textInput}
              value={shareSettings.responseLimit?.toString() || ""}
              onChangeText={(text) => {
                const limit = text ? parseInt(text, 10) : undefined;
                updateShareSettings({ responseLimit: limit || undefined });
              }}
              placeholder="No limit"
              keyboardType="numeric"
            />
            <Text style={styles.inputDescription}>
              Maximum number of responses to collect
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiration Date</Text>
            <TextInput
              style={styles.textInput}
              value={shareSettings.expiresAt || ""}
              onChangeText={(text) => updateShareSettings({ expiresAt: text })}
              placeholder="No expiration"
            />
            <Text style={styles.inputDescription}>
              Form will stop accepting responses after this date
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password Protection</Text>
            <TextInput
              style={styles.textInput}
              value={shareSettings.password || ""}
              onChangeText={(text) => updateShareSettings({ password: text })}
              placeholder="No password"
              secureTextEntry
            />
            <Text style={styles.inputDescription}>
              Require a password to access the form
            </Text>
          </View>
        </View>

        {/* Form Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Responses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
  },
  linkContainer: {
    marginBottom: 12,
  },
  linkInput: {
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}40`,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
    minHeight: 60,
  },
  linkActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  actionButtonSuccess: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  actionButtonTextSuccess: {
    color: Colors.light.background,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  regenerateButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  qrCodeContainer: {
    alignItems: "center",
    padding: 20,
  },
  qrCodePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: Colors.light.tabIconDefault + "40",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  qrCodeText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}20`,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}40`,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.tint,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
  },
});
