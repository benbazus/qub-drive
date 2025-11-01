
export function getCurrentParentFolder(contextValue?: string | null): string | null {
  // 1. If context has a value, use it
  if (contextValue !== undefined && contextValue !== null) {
    console.log("Using parent folder from context:", contextValue);
    return contextValue;
  }

  // 2. Try to get from localStorage
  try {
    const stored = localStorage.getItem('currentParentFolder');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("Using parent folder from localStorage:", parsed);
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to read parent folder from localStorage:', error);
  }

  // 3. Try to get from URL params (if we're in a folder view)
  try {
    const url = new URL(window.location.href);
    const folderId = url.searchParams.get('folderId');
    if (folderId) {
      console.log("Using parent folder from URL:", folderId);
      return folderId;
    }
  } catch (error) {
    console.warn('Failed to read parent folder from URL:', error);
  }

  // 4. Default to null (root folder)
  console.log("Using root folder (null) as fallback");
  return null;
}

export function setCurrentParentFolder(folderId: string | null): void {
  console.log("=== SETTING PARENT FOLDER ===");
  console.log("Setting to:", folderId);

  // Save to localStorage
  try {
    if (folderId === null) {
      localStorage.removeItem('currentParentFolder');
    } else {
      localStorage.setItem('currentParentFolder', JSON.stringify(folderId));
    }
    console.log("Saved to localStorage successfully");
  } catch (error) {
    console.warn('Failed to save parent folder to localStorage:', error);
  }

  // Update URL params (optional, for better UX)
  try {
    const url = new URL(window.location.href);
    if (folderId === null) {
      url.searchParams.delete('folderId');
    } else {
      url.searchParams.set('folderId', folderId);
    }
    // Only update if different to avoid unnecessary history entries
    if (url.href !== window.location.href) {
      window.history.replaceState({}, '', url.href);
      console.log("Updated URL successfully");
    }
  } catch (error) {
    console.warn('Failed to update URL with parent folder:', error);
  }
}