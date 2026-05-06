import { Ionicons }  from '@expo/vector-icons';
export interface AppIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}