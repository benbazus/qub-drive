import { useState } from 'react'
import { FileItem } from '@/types/file'

interface DialogState {
  open: boolean
  file: FileItem | null
}

interface DialogStates {
  preview: DialogState
  move: DialogState
  share: DialogState
  rename: DialogState
  delete: DialogState
  details: DialogState
  lock: DialogState
  star: DialogState
  copyFile: DialogState
  download: DialogState
  copyLink: DialogState
}

type DialogType = keyof DialogStates

export const useDialogManager = () => {
  const [dialogs, setDialogs] = useState<DialogStates>({
    preview: { open: false, file: null },
    move: { open: false, file: null },
    share: { open: false, file: null },
    rename: { open: false, file: null },
    delete: { open: false, file: null },
    details: { open: false, file: null },
    lock: { open: false, file: null },
    star: { open: false, file: null },
    copyFile: { open: false, file: null },
    download: { open: false, file: null },
    copyLink: { open: false, file: null }
  })

  const openDialog = (type: DialogType, file: FileItem) => {
    setDialogs(prev => ({
      ...prev,
      [type]: { open: true, file }
    }))
  }

  const closeDialog = (type: DialogType) => {
    setDialogs(prev => ({
      ...prev,
      [type]: { open: false, file: null }
    }))
  }

  const closeAllDialogs = () => {
    setDialogs({
      preview: { open: false, file: null },
      move: { open: false, file: null },
      share: { open: false, file: null },
      rename: { open: false, file: null },
      delete: { open: false, file: null },
      details: { open: false, file: null },
      lock: { open: false, file: null },
      star: { open: false, file: null },
      copyFile: { open: false, file: null },
      download: { open: false, file: null },
      copyLink: { open: false, file: null }
    })
  }

  const isAnyDialogOpen = () => {
    return Object.values(dialogs).some(dialog => dialog.open)
  }

  return {
    dialogs,
    openDialog,
    closeDialog,
    closeAllDialogs,
    isAnyDialogOpen
  }
}