import type { PressableStateCallbackType } from 'react-native';

// React Native Web, Pressable'a fare üstündeyken "hovered" da gönderir; tiplerde yok.
export type PressState = PressableStateCallbackType & { hovered?: boolean };
