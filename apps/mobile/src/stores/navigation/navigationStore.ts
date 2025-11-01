import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NavigationItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  parentId?: string;
}

interface NavigationHistory {
  items: NavigationItem[];
  timestamp: number;
  visitCount: number;
}

interface FavoriteFolder {
  folder: NavigationItem;
  addedAt: number;
}

interface NavigationState {
  // Current breadcrumb path
  currentPath: NavigationItem[];

  // Navigation history for quick access
  history: NavigationHistory[];

  // Favorite folders for quick access
  favorites: FavoriteFolder[];

  // Recently visited folders (separate from history)
  recentFolders: NavigationItem[];

  // Actions
  setCurrentPath: (path: NavigationItem[]) => void;
  navigateToFolder: (folder: NavigationItem) => void;
  navigateBack: () => void;
  navigateToRoot: () => void;
  navigateToPath: (pathItems: NavigationItem[]) => void;
  addToHistory: (path: NavigationItem[]) => void;
  clearHistory: () => void;
  getRecentFolders: () => NavigationItem[];
  addToFavorites: (folder: NavigationItem) => void;
  removeFromFavorites: (folderId: string) => void;
  getFavorites: () => NavigationItem[];
  isFavorite: (folderId: string) => boolean;
  getPathToFolder: (folderId: string) => NavigationItem[] | null;
  findFolderInHistory: (folderId: string) => NavigationItem | null;
}

const ROOT_FOLDER: NavigationItem = {
  id: "root",
  name: "My Files",
  path: "/",
  isFolder: true,
};

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentPath: [ROOT_FOLDER],
      history: [],
      favorites: [],
      recentFolders: [],

      setCurrentPath: (path: NavigationItem[]) => {
        set({ currentPath: path });
        get().addToHistory(path);
      },

      navigateToFolder: (folder: NavigationItem) => {
        const currentPath = get().currentPath;

        // Check if folder is already in the path (going back)
        const existingIndex = currentPath.findIndex(
          (item) => item.id === folder.id
        );

        if (existingIndex !== -1) {
          // Navigate back to this folder
          const newPath = currentPath.slice(0, existingIndex + 1);
          set({ currentPath: newPath });
        } else {
          // Navigate forward to new folder
          const newPath = [...currentPath, folder];
          set({ currentPath: newPath });
        }

        get().addToHistory(get().currentPath);
        
        // Update recent folders
        const recentFolders = get().recentFolders;
        const updatedRecent = [
          folder,
          ...recentFolders.filter(f => f.id !== folder.id)
        ].slice(0, 10);
        set({ recentFolders: updatedRecent });
      },

      navigateBack: () => {
        const currentPath = get().currentPath;
        if (currentPath.length > 1) {
          const newPath = currentPath.slice(0, -1);
          set({ currentPath: newPath });
          get().addToHistory(newPath);
        }
      },

      navigateToRoot: () => {
        set({ currentPath: [ROOT_FOLDER] });
        get().addToHistory([ROOT_FOLDER]);
      },

      navigateToPath: (pathItems: NavigationItem[]) => {
        if (pathItems.length === 0) {
          get().navigateToRoot();
          return;
        }
        
        set({ currentPath: pathItems });
        get().addToHistory(pathItems);
        
        // Add the last folder to recent folders if it's not root
        const lastFolder = pathItems[pathItems.length - 1];
        if (lastFolder && lastFolder.id !== "root") {
          const recentFolders = get().recentFolders;
          const updatedRecent = [
            lastFolder,
            ...recentFolders.filter(f => f.id !== lastFolder.id)
          ].slice(0, 10);
          set({ recentFolders: updatedRecent });
        }
      },

      addToHistory: (path: NavigationItem[]) => {
        const history = get().history;
        const pathKey = JSON.stringify(path);
        
        // Find existing history item
        const existingIndex = history.findIndex(
          (item) => JSON.stringify(item.items) === pathKey
        );

        if (existingIndex !== -1) {
          // Update existing item
          const existingItem = history[existingIndex];
          if (existingItem) {
            const updatedItem: NavigationHistory = {
              items: existingItem.items,
              timestamp: Date.now(),
              visitCount: existingItem.visitCount + 1,
            };
          
            const newHistory = [
              updatedItem,
              ...history.slice(0, existingIndex),
              ...history.slice(existingIndex + 1)
            ];
            
            set({ history: newHistory });
          }
        } else {
          // Add new item
          const newHistoryItem: NavigationHistory = {
            items: path,
            timestamp: Date.now(),
            visitCount: 1,
          };

          const newHistory = [newHistoryItem, ...history].slice(0, 50); // Keep last 50 items
          set({ history: newHistory });
        }
      },

      clearHistory: () => {
        set({ history: [], recentFolders: [] });
      },

      getRecentFolders: () => {
        const history = get().history;
        const recentFolders: NavigationItem[] = [];

        // Sort history by timestamp and visit count
        const sortedHistory = [...history].sort((a, b) => {
          const scoreA = a.timestamp + (a.visitCount * 86400000); // Add 1 day per visit
          const scoreB = b.timestamp + (b.visitCount * 86400000);
          return scoreB - scoreA;
        });

        // Extract unique folders from history
        sortedHistory.forEach((historyItem) => {
          const lastFolder = historyItem.items[historyItem.items.length - 1];
          if (lastFolder && lastFolder.isFolder && lastFolder.id !== "root") {
            const exists = recentFolders.find(
              (folder) => folder.id === lastFolder.id
            );
            if (!exists) {
              recentFolders.push(lastFolder);
            }
          }
        });

        return recentFolders.slice(0, 10); // Return top 10 recent folders
      },

      addToFavorites: (folder: NavigationItem) => {
        const favorites = get().favorites;
        const exists = favorites.find(fav => fav.folder.id === folder.id);
        
        if (!exists) {
          const newFavorite: FavoriteFolder = {
            folder,
            addedAt: Date.now(),
          };
          set({ favorites: [...favorites, newFavorite] });
        }
      },

      removeFromFavorites: (folderId: string) => {
        const favorites = get().favorites;
        const filtered = favorites.filter(fav => fav.folder.id !== folderId);
        set({ favorites: filtered });
      },

      getFavorites: () => {
        return get().favorites
          .sort((a, b) => b.addedAt - a.addedAt)
          .map(fav => fav.folder);
      },

      isFavorite: (folderId: string) => {
        return get().favorites.some(fav => fav.folder.id === folderId);
      },

      getPathToFolder: (folderId: string) => {
        const history = get().history;
        
        // Find the most recent path that ends with this folder
        for (const historyItem of history) {
          const lastFolder = historyItem.items[historyItem.items.length - 1];
          if (lastFolder && lastFolder.id === folderId) {
            return historyItem.items;
          }
        }
        
        return null;
      },

      findFolderInHistory: (folderId: string) => {
        const history = get().history;
        
        for (const historyItem of history) {
          for (const item of historyItem.items) {
            if (item.id === folderId && item.isFolder) {
              return item;
            }
          }
        }
        
        return null;
      },
    }),
    {
      name: "navigation-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        history: state.history,
        favorites: state.favorites,
        recentFolders: state.recentFolders,
      }),
    }
  )
);
