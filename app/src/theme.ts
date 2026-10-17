import { Platform, type TextStyle } from 'react-native';

export const colors = {
  bg: '#0B0B0C',
  surface: '#141416',
  surfaceHigh: '#1C1C1F',
  border: '#2A2A2F',
  borderStrong: '#3A3A40',
  text: '#F4F4EF',
  textMuted: '#8D8D95',
  textFaint: '#5A5A62',
  accent: '#D4FF3A',
  accentInk: '#0B0B0C',
  danger: '#FF6B5B',
};

export const fonts = {
  display: 'Unbounded_800ExtraBold',
  displaySemi: 'Unbounded_600SemiBold',
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
};

// Ekranlar telefon genişliğinde tasarlanır; bilgisayarda aynı sütun ortalanır.
export const CONTENT_MAX_WIDTH = 440;

// Web'de metin kutularının tarayıcı odak çerçevesini kaldırır (odak, kutunun kenar rengiyle gösterilir)
// ve varsayılan minimum genişliği sıfırlar ki dar kutulardan taşmasın.
export const webInputReset: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none', minWidth: 0 } as unknown as TextStyle) : {};
