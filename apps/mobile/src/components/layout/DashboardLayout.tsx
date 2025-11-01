import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { DashboardHeader } from "./DashboardHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface DashboardLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFAB?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: ReactNode;
}

export function DashboardLayout({
  children,
  showHeader = true,
  showFAB = true,
  refreshing = false,
  onRefresh,
  headerComponent,
}: DashboardLayoutProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  // Responsive breakpoints
  const isSmallScreen = width < 375;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  const containerPadding = isTablet ? 24 : 16;
  const contentSpacing = isSmallScreen ? 12 : 16;

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      {showHeader && (headerComponent || <DashboardHeader />)}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(
              showFAB ? 100 : 20,
              insets.bottom + (showFAB ? 80 : 20)
            ),
            paddingHorizontal:
              isLandscape && isTablet ? containerPadding * 2 : 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? "light"].tint}
              colors={[Colors[colorScheme ?? "light"].tint]}
            />
          ) : undefined
        }
      >
        <View
          style={[
            styles.contentContainer,
            {
              gap: contentSpacing,
              maxWidth: isTablet ? 800 : "100%",
              alignSelf: isTablet ? "center" : "stretch",
            },
          ]}
        >
          {children}
        </View>
      </ScrollView>

      {showFAB && <FloatingActionButton />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
