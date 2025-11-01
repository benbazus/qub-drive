import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import documentEndpoint, { 
  InviteUserRequest, 
  ChangePermissionRequest, 
  LinkAccessSettings 
} from '@/api/endpoints/document.endpoint';

// Invite user mutation
export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, data }: { documentId: string; data: InviteUserRequest }) => {
      return await documentEndpoint.inviteUser(documentId, data);
    },
    onSuccess: (_, { documentId }) => {
      // Invalidate collaborators query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['collaborators', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] });
    },
  });
}

// Change permission mutation
export function useChangePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      documentId, 
      userId, 
      data 
    }: { 
      documentId: string; 
      userId: string; 
      data: ChangePermissionRequest 
    }) => {
      return await documentEndpoint.changePermission(documentId, userId, data);
    },
    onSuccess: (_, { documentId }) => {
      // Invalidate collaborators query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['collaborators', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] });
    },
  });
}

// Remove collaborator mutation
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, userId }: { documentId: string; userId: string }) => {
      return await documentEndpoint.removeCollaborator(documentId, userId);
    },
    onSuccess: (_, { documentId }) => {
      // Invalidate collaborators query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['collaborators', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', documentId] });
    },
  });
}

// Update link access mutation
export function useUpdateLinkAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, data }: { documentId: string; data: LinkAccessSettings }) => {
      return await documentEndpoint.updateLinkAccess(documentId, data);
    },
    onSuccess: (_, { documentId }) => {
      // Invalidate link access query
      queryClient.invalidateQueries({ queryKey: ['linkAccess', documentId] });
    },
  });
}

// Get collaborators query
export function useGetCollaborators(documentId: string) {
  return useQuery({
    queryKey: ['collaborators', documentId],
    queryFn: async () => {
      return await documentEndpoint.getCollaborators(documentId);
    },
    enabled: !!documentId,
  });
}

// Get link access settings query
export function useGetLinkAccess(documentId: string) {
  return useQuery({
    queryKey: ['linkAccess', documentId],
    queryFn: async () => {
      return await documentEndpoint.getLinkAccess(documentId);
    },
    enabled: !!documentId,
  });
}