
import { SaveDocumentRequest } from "@/api/endpoints/collaboration.endpoint";
import documentEndpoint from "@/api/endpoints/document.endpoint";
import { useMutation, useQuery } from "@tanstack/react-query";

interface SaveDocumentMutationParams { documentId: string; title: string; content: string; }

export function useSaveDocuments() {
    const saveDocumentMutation = useMutation({
        mutationFn: async ({ documentId, title, content }: SaveDocumentMutationParams) => {
            const data: SaveDocumentRequest = {
                title,
                content
            };
            return await documentEndpoint.saveDocument(documentId, data);
        },
    });

    return { saveDocumentMutation };
}

export function useGetDocuments(documentId: string) {
    return useQuery({
        queryKey: ['documents', documentId],
        queryFn: async () => {
            return await documentEndpoint.getDocumentContent(documentId);
        },
    });


}

