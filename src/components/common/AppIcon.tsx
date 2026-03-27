import { Ionicons }  from '@expo/vector-icons';
import { Colors }    from '../../theme/colors';

interface AppIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}


export function AppIcon({ name, size = 24, color = Colors.bordeauxDark }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

