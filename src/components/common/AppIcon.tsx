import { Ionicons }  from '@expo/vector-icons';
import { Colors }    from '../../theme/colors';
import { AppIconProps } from '../../types/app-icon-props.types';

export function AppIcon({ name, size = 24, color = Colors.bordeauxDark }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

