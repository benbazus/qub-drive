import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userSettingsEndpoint, UserSettings, UserSettingsUpdate, UserSettingsCategory } from '@/api/endpoints/user-settings.endpoint';

export const useUserSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error, refetch } = useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: () => userSettingsEndpoint.getUserSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: UserSettingsUpdate) => userSettingsEndpoint.updateUserSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => userSettingsEndpoint.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetToDefaults: resetMutation.mutate,
    resetToDefaultsAsync: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
    refetch,
  };
};

export const useUserSettingsByCategory = (category: UserSettingsCategory) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery<Partial<UserSettings>>({
    queryKey: ['userSettings', category],
    queryFn: () => userSettingsEndpoint.getUserSettingsByCategory(category),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserSettingsUpdate>) =>
      userSettingsEndpoint.updateUserSettingsByCategory(category, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings', category] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export default useUserSettings;
