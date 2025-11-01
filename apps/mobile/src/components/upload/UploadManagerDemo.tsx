import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadProgressModal } from "./UploadProgressModal";
import { UploadFloatingIndicator } from "./UploadFloatingIndicator";
import { Colors } from "@/constants/theme";

export const UploadManagerDemo: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parentId] = useState<string>();

  const {
    uploadStats,
    isInitialized,
    addToQueue,
    clearCompleted,
    clearAll,
    getNetworkStatus,
  } = useFileUpload({
    onComplete: (item) => {
      
    },
    onError: (item, error) => {
      console.error("Upload failed:", item.fileName, error.message);
    },
  });

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const files = result.assets.map((asset) => ({
          uri: asset.uri,
          fileName: asset.name,
          size: asset.size || 0,
          ...(parentId && { parentId }),
        }));

        await addToQueue(files);

        Alert.alert(
          "Files Added",
          `${files.length} file(s) added to upload queue`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Failed to pick documents:", error);
      Alert.alert("Error", "Failed to pick documents");
    }
  };

  const handlePickImages = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library permission is required"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const files = result.assets.map((asset, index) => ({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          size: asset.fileSize || 0,
          ...(parentId && { parentId }),
        }));

        await addToQueue(files);

        Alert.alert(
          "Images Added",
          `${files.length} image(s) added to upload queue`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Failed to pick images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const files = [
          {
            uri: asset.uri,
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
            size: asset.fileSize || 0,
            ...(parentId && { parentId }),
          },
        ];

        await addToQueue(files);

        Alert.alert("Photo Added", "Photo added to upload queue", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
      Alert.alert("Success", "Completed uploads cleared");
    } catch (error) {
      console.error("Failed to clear completed:", error);
      Alert.alert("Error", "Failed to clear completed uploads");
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Uploads",
      "Are you sure you want to clear all uploads? This will cancel any active uploads.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAll();
              Alert.alert("Success", "All uploads cleared");
            } catch (error) {
              console.error("Failed to clear all:", error);
              Alert.alert("Error", "Failed to clear all uploads");
            }
          },
        },
      ]
    );
  };

  const networkStatus = getNetworkStatus();

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing upload manager...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Manager Demo</Text>
          <Text style={styles.subtitle}>
            Test the enhanced upload system with progress tracking, background
            uploads, and network interruption handling
          </Text>
        </View>

        {/* Network Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: networkStatus.isConnected
                  ? "#E8F5E8"
                  : "#FFEBEE",
              },
            ]}
          >
            <Ionicons
              name={networkStatus.isConnected ? "wifi" : "close-circle"}
              size={24}
              color={networkStatus.isConnected ? "#4CAF50" : "#F44336"}
            />
            <View style={styles.statusText}>
              <Text
                style={[
                  styles.statusTitle,
                  { color: networkStatus.isConnected ? "#4CAF50" : "#F44336" },
                ]}
              >
                {networkStatus.isConnected ? "Connected" : "Disconnected"}
              </Text>
              <Text style={styles.statusSubtitle}>
                Type: {networkStatus.type || "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Upload Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{uploadStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.light.tint }]}>
                {uploadStats.uploading}
              </Text>
              <Text style={styles.statLabel}>Uploading</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {uploadStats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#F44336" }]}>
                {uploadStats.failed}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </View>

        {/* Upload Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Files to Queue</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickDocuments}
          >
            <Ionicons name="document-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Pick Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImages}
          >
            <Ionicons name="images-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Pick Images</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Queue Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Queue Management</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowUploadModal(true)}
          >
            <Ionicons name="list-outline" size={24} color={Colors.light.tint} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              View Upload Progress
            </Text>
          </TouchableOpacity>

          {uploadStats.completed > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.warningButton]}
              onPress={handleClearCompleted}
            >
              <Ionicons name="checkmark-done-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Clear Completed</Text>
            </TouchableOpacity>
          )}

          {uploadStats.total > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Background uploads</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Progress tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                Network interruption handling
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Pause/Resume uploads</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Push notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                Automatic retry with backoff
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upload Progress Modal */}
      <UploadProgressModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* Floating Upload Indicator */}
      <UploadFloatingIndicator onPress={() => setShowUploadModal(true)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: Colors.light.icon,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  secondaryButtonText: {
    color: Colors.light.tint,
  },
  warningButton: {
    backgroundColor: "#FF9800",
  },
  dangerButton: {
    backgroundColor: "#F44336",
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
  },
});

export default UploadManagerDemo;
