// Navigation related type definitions
export type RootStackParamList = {
  '(tabs)': undefined
  'auth/login': undefined
  'auth/register': undefined
  'document/[id]': { id: string }
  'spreadsheet/[id]': { id: string }
  'form/[id]': { id: string }
}

export type TabParamList = {
  'index': undefined
  'files': undefined
  'shared': undefined
  'profile': undefined
}