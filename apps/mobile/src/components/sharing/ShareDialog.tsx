import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@/types/file';
import { ShareInvitation, FileShare, ShareLinkRequest } from '@/types/sharing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sharingService } from '@/services/sharingService';

interface ShareDialogProps {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
  onSuccess?: (share: FileShare) => void;
  onError?: (error: string) => void;
}

interface EmailValidation {
  email: string;
  isValid: boolean;
  isRegistered: boolean;
  userId?: string;
  name?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  visible,
  file,
  onClose,
  onSuccess,
  onError,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  // State
  const [emailInput, setEmailInput] = useState('');
  const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');
  const [message, setMessage] = useState('');
  const [createLink, setCreateLink] = useState(false);
  const [linkSettings, setLinkSettings] = useState<ShareLinkRequest>({
    accessLevel: 'view',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailValidations, setEmailValidations] = useState<EmailValidation[]>([]);
  const [existingShare, setExistingShare] = useState<FileShare | null>(null);

  // Load existing share data
  useEffect(() => {
    if (visible && file) {
      loadExistingShare();
    }
  }, [visible, file]);

  const loadExistingShare = async () => {
    if (!file) return;
    
    try {
      const share = await sharingService.getFileSharing(file.id);
      setExistingShare(share);
      
      // Pre-populate link settings if link exists
      if (share.shareLink) {
        setCreateLink(true);
        setLinkSettings({
          accessLevel: share.shareLink.accessLevel,
          password: share.shareLink.hasPassword ? '••••••••' : undefined,
          expiresAt: share.shareLink.expiresAt,
          maxDownloads: share.shareLink.maxDownloads,
        });
      }
    } catch (error) {
      // File might not be shared yet, which is fine
      console.log('No existing share found');
    }
  };

  const validateEmails = useCallback(async (emails: string[]) => {
    if (emails.length === 0) return;
    
    try {
      const validations = await sharingService.validateEmails(emails);
      setEmailValidations(validations);
    } catch (error) {
      console.error('Failed to validate emails:', error);
    }
  }, []);

  const addEmailInvitation = () => {
    const email = emailInput.trim().toLowerCase();
    
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    // Check if email already added
    if (invitations.some(inv => inv.email === email)) {
      Alert.alert('Duplicate Email', 'This email has already been added.');
      return;
    }
    
    const newInvitation: ShareInvitation = {
      email,
      role: selectedRole,
      message: message.trim() || undefined,
    };
    
    const updatedInvitations = [...invitations, newInvitation];
    setInvitations(updatedInvitations);
    setEmailInput('');
    
    // Validate the new email
    validateEmails([email]);
  };

  const removeInvitation = (email: string) => {
    setInvitations(invitations.filter(inv => inv.email !== email));
    setEmailValidations(emailValidations.filter(val => val.email !== email));
  };

  const updateInvitationRole = (email: string, role: 'viewer' | 'editor') => {
    setInvitations(invitations.map(inv => 
      inv.email === email ? { ...inv, role } : inv
    ));
  };

  const handleShare = async () => {
    if (!file) return;
    
    if (invitations.length === 0 && !createLink) {
      Alert.alert('No Recipients', 'Please add at least one email or enable link sharing.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let share: FileShare;
      
      if (existingShare) {
        // Update existing share
        if (invitations.length > 0) {
          share = await sharingService.shareWithUsers(file.id, invitations);
        } else {
          share = existingShare;
        }
        
        // Update link if needed
        if (createLink && linkSettings) {
          await sharingService.updateSharingLink(file.id, linkSettings);
        } else if (!createLink && existingShare.shareLink) {
          await sharingService.revokeSharingLink(file.id);
        }
      } else {
        // Create new share
        const request = {
          fileId: file.id,
          userEmails: invitations.map(inv => inv.email),
          role: selectedRole,
          message: message.trim() || undefined,
          createLink,
          linkSettings: createLink ? linkSettings : undefined,
        };
        
        share = await sharingService.createShare(request);
      }
      
      onSuccess?.(share);
      onClose();
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share file';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmailInput('');
    setInvitations([]);
    setSelectedRole('viewer');
    setMessage('');
    setCreateLink(false);
    setLinkSettings({ accessLevel: 'view' });
    setEmailValidations([]);
    setExistingShare(null);
  };

  const getEmailValidation = (email: string) => {
    return emailValidations.find(val => val.email === email);
  };

  if (!visible || !file) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: `${iconColor}33` }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>Share</Text>
            <TouchableOpacity 
              onPress={handleShare}
              disabled={isLoading}
              style={[
                styles.shareButton,
                { backgroundColor: tintColor },
                isLoading && styles.disabledButton
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.shareButtonText}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* File Info */}
            <View style={[styles.fileInfo, { backgroundColor: `${tintColor}1A` }]}>
              <Ionicons
                name={file.type === 'folder' ? 'folder' : 'document'}
                size={24}
                color={tintColor}
              />
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={[styles.fileType, { color: iconColor }]}>
                  {file.type === 'folder' ? 'Folder' : 'File'}
                </Text>
              </View>
            </View>

            {/* Email Invitations */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Invite People
              </Text>
              
              {/* Email Input */}
              <View style={[styles.emailInputContainer, { borderColor: `${iconColor}33` }]}>
                <TextInput
                  style={[styles.emailInput, { color: textColor }]}
                  placeholder="Enter email address"
                  placeholderTextColor={`${iconColor}99`}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={addEmailInvitation}
                />
                <TouchableOpacity
                  onPress={addEmailInvitation}
                  style={[styles.addButton, { backgroundColor: tintColor }]}
                  disabled={!emailInput.trim()}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <View style={styles.roleSelection}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 'viewer' && { backgroundColor: `${tintColor}33` }
                  ]}
                  onPress={() => setSelectedRole('viewer')}
                >
                  <Text style={[styles.roleText, { color: textColor }]}>Viewer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    selectedRole === 'editor' && { backgroundColor: `${tintColor}33` }
                  ]}
                  onPress={() => setSelectedRole('editor')}
                >
                  <Text style={[styles.roleText, { color: textColor }]}>Editor</Text>
                </TouchableOpacity>
              </View>

              {/* Invitations List */}
              {invitations.map((invitation) => {
                const validation = getEmailValidation(invitation.email);
                return (
                  <View key={invitation.email} style={[styles.invitationItem, { borderColor: `${iconColor}33` }]}>
                    <View style={styles.invitationInfo}>
                      <Text style={[styles.invitationEmail, { color: textColor }]}>
                        {invitation.email}
                      </Text>
                      {validation && (
                        <Text style={[
                          styles.validationText,
                          { color: validation.isValid ? '#4CAF50' : '#F44336' }
                        ]}>
                          {validation.isRegistered ? 'Registered user' : 'Will receive invitation'}
                        </Text>
                      )}
                      <View style={styles.roleSelector}>
                        <TouchableOpacity
                          style={[
                            styles.miniRoleButton,
                            invitation.role === 'viewer' && { backgroundColor: `${tintColor}33` }
                          ]}
                          onPress={() => updateInvitationRole(invitation.email, 'viewer')}
                        >
                          <Text style={[styles.miniRoleText, { color: textColor }]}>Viewer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.miniRoleButton,
                            invitation.role === 'editor' && { backgroundColor: `${tintColor}33` }
                          ]}
                          onPress={() => updateInvitationRole(invitation.email, 'editor')}
                        >
                          <Text style={[styles.miniRoleText, { color: textColor }]}>Editor</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeInvitation(invitation.email)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Message (Optional)
              </Text>
              <TextInput
                style={[
                  styles.messageInput,
                  { 
                    color: textColor,
                    borderColor: `${iconColor}33`,
                    backgroundColor: `${backgroundColor}99`
                  }
                ]}
                placeholder="Add a message to your invitation"
                placeholderTextColor={`${iconColor}99`}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Link Sharing */}
            <View style={styles.section}>
              <View style={styles.linkHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Link Sharing
                </Text>
                <Switch
                  value={createLink}
                  onValueChange={setCreateLink}
                  trackColor={{ false: `${iconColor}33`, true: `${tintColor}66` }}
                  thumbColor={createLink ? tintColor : `${iconColor}99`}
                />
              </View>
              
              {createLink && (
                <View style={styles.linkSettings}>
                  {/* Access Level */}
                  <View style={styles.linkOption}>
                    <Text style={[styles.linkOptionLabel, { color: textColor }]}>
                      Access Level
                    </Text>
                    <View style={styles.accessLevelButtons}>
                      <TouchableOpacity
                        style={[
                          styles.accessButton,
                          linkSettings.accessLevel === 'view' && { backgroundColor: `${tintColor}33` }
                        ]}
                        onPress={() => setLinkSettings({ ...linkSettings, accessLevel: 'view' })}
                      >
                        <Text style={[styles.accessButtonText, { color: textColor }]}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.accessButton,
                          linkSettings.accessLevel === 'edit' && { backgroundColor: `${tintColor}33` }
                        ]}
                        onPress={() => setLinkSettings({ ...linkSettings, accessLevel: 'edit' })}
                      >
                        <Text style={[styles.accessButtonText, { color: textColor }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Protection */}
                  <View style={styles.linkOption}>
                    <Text style={[styles.linkOptionLabel, { color: textColor }]}>
                      Password (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        { 
                          color: textColor,
                          borderColor: `${iconColor}33`,
                          backgroundColor: `${backgroundColor}99`
                        }
                      ]}
                      placeholder="Enter password"
                      placeholderTextColor={`${iconColor}99`}
                      value={linkSettings.password || ''}
                      onChangeText={(password) => setLinkSettings({ ...linkSettings, password })}
                      secureTextEntry
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  emailInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    margin: 4,
    padding: 8,
    borderRadius: 6,
  },
  roleSelection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  invitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
  },
  miniRoleButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  miniRoleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  linkSettings: {
    paddingLeft: 16,
  },
  linkOption: {
    marginBottom: 16,
  },
  linkOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  accessLevelButtons: {
    flexDirection: 'row',
  },
  accessButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  accessButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
});