import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterClientScreen from '../screens/auth/RegisterClientScreen';
import RegisterDriverScreen from '../screens/auth/RegisterDriverScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from '../types/auth.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="RegisterClient" component={RegisterClientScreen} />
      <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}