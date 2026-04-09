import type { PropsWithChildren } from 'react';
import {
  findNodeHandle,
  Keyboard,
  TextInput,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type DismissKeyboardViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function DismissKeyboardView({ children, style }: DismissKeyboardViewProps) {
  const handleStartCapture = (event: GestureResponderEvent) => {
    const focusedInput =
      typeof TextInput.State.currentlyFocusedInput === 'function'
        ? (TextInput.State.currentlyFocusedInput() as unknown)
        : null;
    const focusedField =
      focusedInput != null
        ? findNodeHandle(focusedInput as Parameters<typeof findNodeHandle>[0])
        : null;
    const targetHandle = event.target as unknown as number | null;
    if (focusedField != null && targetHandle === focusedField) {
      return false;
    }

    Keyboard.dismiss();
    return false;
  };

  return (
    <View style={style} accessible={false} onStartShouldSetResponderCapture={handleStartCapture}>
      {children}
    </View>
  );
}
