import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { FileItem } from "@/types/file";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getFileIcon } from "@/utils/fileUtils";

interface FileThumbnailProps {
  file: FileItem;
  size?: number;
  borderRadius?: number;
  showFallback?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  size = 48,
  borderRadius = 8,
  showFallback = true,
  onLoad,
  onError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const iconColor = useThemeColor({}, "icon");
  const tintColor = useThemeColor({}, "tint");

  const isFolder = file.type === "folder";
  const hasThumbnail = file.thumbnailUrl && !isFolder && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
  };

  if (hasThumbnail) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={{ uri: file.thumbnailUrl || "" }}
          style={[styles.image, containerStyle]}
          contentFit="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          transition={200}
          placeholder={require("../../../assets/images/icon.png")}
        />

        {/* Loading overlay */}
        {imageLoading && (
          <View
            style={[
              styles.loadingOverlay,
              containerStyle,
              { backgroundColor: `${tintColor}10` },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={size * 0.4}
              color={iconColor}
            />
          </View>
        )}
      </View>
    );
  }

  // Fallback to file type icon
  if (showFallback) {
    return (
      <View
        style={[
          styles.iconContainer,
          containerStyle,
          { backgroundColor: `${tintColor}10` },
        ]}
      >
        {getFileIcon(file.mimeType || file.type, size * 0.6, iconColor)}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
