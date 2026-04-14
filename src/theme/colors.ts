export interface ColorPalette {
  readonly background: string
  readonly surface: string
  readonly text: string
  readonly textMuted: string
  readonly primary: string
  readonly danger: string
  readonly warning: string
  readonly success: string
  readonly border: string
}

export const lightPalette: ColorPalette = {
  background: '#ffffff',
  surface: '#f9f9f9',
  text: '#111111',
  textMuted: '#555555',
  primary: '#1f6feb',
  danger: '#d33a3a',
  warning: '#e2a23a',
  success: '#2f9e44',
  border: '#e2e2e2',
}

export const darkPalette: ColorPalette = {
  background: '#0b0b0b',
  surface: '#151515',
  text: '#f4f4f4',
  textMuted: '#a0a0a0',
  primary: '#4f8dff',
  danger: '#ff6b6b',
  warning: '#ffbd4d',
  success: '#55d175',
  border: '#2a2a2a',
}
