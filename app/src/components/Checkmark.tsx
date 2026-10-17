import { View } from 'react-native';

// Fonttan bağımsız tik işareti: iki kenarı çizilmiş, 45° döndürülmüş bir kutu.
export function Checkmark({ size = 16, color, weight = 2.5 }: { size?: number; color: string; weight?: number }) {
  return (
    <View
      style={{
        width: size * 0.42,
        height: size * 0.78,
        marginTop: -size * 0.14,
        borderRightWidth: weight,
        borderBottomWidth: weight,
        borderColor: color,
        borderBottomRightRadius: weight / 2,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}
