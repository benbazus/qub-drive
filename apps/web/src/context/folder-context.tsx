import { createContext, useContext, useState, ReactNode } from 'react'

interface FolderContextType {
  getParentFolder: string | null
  setParentFolder: (folderId: string | null) => void
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

interface FolderProviderProps {
  children: ReactNode
}

export function FolderProvider({ children }: FolderProviderProps) {
  // Initialize from localStorage or default to null (root folder)
  const [getParentFolder, setParentFolderState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('currentParentFolder');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Enhanced setter that also saves to localStorage
  const setParentFolder = (folderId: string | null) => {
    console.log("=== CONTEXT UPDATE ===");
    console.log("Setting parent folder to:", folderId);
    
    setParentFolderState(folderId);
    
    try {
      if (folderId === null) {
        localStorage.removeItem('currentParentFolder');
      } else {
        localStorage.setItem('currentParentFolder', JSON.stringify(folderId));
      }
    } catch (error) {
      console.warn('Failed to save parent folder to localStorage:', error);
    }
    
    console.log("Parent folder set successfully");
  };

  return (
    <FolderContext.Provider value={{ getParentFolder, setParentFolder }}>
      {children}
    </FolderContext.Provider>
  )
}

export function useFolder() {
  const context = useContext(FolderContext)
  if (context === undefined) {
    throw new Error('useFolder must be used within a FolderProvider')
  }
  return context
}