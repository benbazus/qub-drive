import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EnhancedFileGrid } from './EnhancedFileGrid';

// Mock data for demonstration
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'file',
    size: 2048576,
    mimeType: 'application/pdf',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isStarred: true,
    isShared: false,
    thumbnailUrl: undefined,
  },
  {
    id: '2',
    name: 'Images',
    type: 'folder',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    isStarred: false,
    isShared: true,
  },
  {
    id: '3',
    name: 'Meeting Notes.docx',
    type: 'file',
    size: 524288,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    createdAt: '2024-01-18T14:20:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    isStarred: false,
    isShared: false,
  },
  {
    id: '4',
    name: 'Budget Spreadsheet.xlsx',
    type: 'file',
    size: 1048576,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    createdAt: '2024-01-12T11:15:00Z',
    updatedAt: '2024-01-19T16:30:00Z',
    isStarred: true,
    isShared: true,
  },
  {
    id: '5',
    name: 'Presentation.pptx',
    type: 'file',
    size: 3145728,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    createdAt: '2024-01-14T13:45:00Z',
    updatedAt: '2024-01-14T13:45:00Z',
    isStarred: false,
    isShared: false,
  },
  {
    id: '6',
    name: 'Documents',
    type: 'folder',
    createdAt: '2024-01-08T08:30:00Z',
    updatedAt: '2024-01-21T12:00:00Z',
    isStarred: false,
    isShared: false,
  },
];

export const FileActionsDemo: React.FC = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<string>('');

  // Handle file press (navigation)
  const handleFilePress = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      Alert.alert('Navigate', `Would navigate to folder: ${file.name}`);
    } else {
      Alert.alert('Open File', `Would open file: ${file.name}`);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      setMessage('Files refreshed');
      setTimeout(() => setMessage(''), 2000);
    }, 1000);
  }, []);

  // Handle success messages
  const handleSuccess = useCallback((successMessage: string) => {
    setMessage(successMessage);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  // Handle error messages
  const handleError = useCallback((errorMessage: string) => {
    Alert.alert('Error', errorMessage);
  }, []);

  // Toggle layout
  const toggleLayout = useCallback(() => {
    setLayout(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: iconColor + '20' }]}>
        <Text style={[styles.title, { color: textColor }]}>
          File Actions Demo
        </Text>
        <TouchableOpacity
          style={[styles.layoutButton, { backgroundColor: tintColor + '20' }]}
          onPress={toggleLayout}
          activeOpacity={0.7}
        >
          <Ionicons
            name={layout === 'grid' ? 'list' : 'grid'}
            size={20}
            color={tintColor}
          />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={[styles.instructions, { backgroundColor: tintColor + '10' }]}>
        <Text style={[styles.instructionText, { color: textColor }]}>
          • Tap files to open them{'\n'}
          • Long press for context menu{'\n'}
          • Use selection mode for bulk operations
        </Text>
      </View>

      {/* Message */}
      {message ? (
        <View style={[styles.messageContainer, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {/* File Grid */}
      <EnhancedFileGrid
        files={files}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onFilePress={handleFilePress}
        layout={layout}
        numColumns={layout === 'grid' ? 2 : 1}
        showMetadata={true}
        showThumbnails={true}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  layoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});