import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colorProps: { light?: string; dark?: string } = {}
  if (lightColor) colorProps.light = lightColor
  if (darkColor) colorProps.dark = darkColor
  const backgroundColor = useThemeColor(colorProps, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
