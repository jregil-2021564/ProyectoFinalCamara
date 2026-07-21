// src/navigation/AuthStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../features/auth/screens/LoginScreen.jsx';
import RegisterScreen from '../features/auth/screens/RegisterScreen.jsx';
import CheckEmailScreen from '../features/auth/screens/CheckEmailScreen.jsx';
import VerifyEmailScreen from '../features/auth/screens/VerifyEmailScreen.jsx';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from '../features/auth/screens/ResetPasswordScreen.jsx';
import ResendVerificationScreen from '../features/auth/screens/ResendVerificationScreen.jsx';
import LandingScreen from '../features/landing/screens/LandingScreen.jsx';
import AboutScreen from '../features/landing/screens/AboutScreen.jsx';
import LocationScreen from '../features/landing/screens/LocationScreen.jsx';
import LoadingTransitionScreen from './LoadingTransitionScreen.jsx';
import NewsScreen from '../features/news/screens/NewsScreen.jsx';
import MunicipalMapScreen from '../features/map/screens/MunicipalMapScreen.jsx';
import DirectoryScreen from '../features/directory/screens/DirectoryScreen.jsx';

const Stack = createNativeStackNavigator();

export default function AuthStack({ initialRoute, initialParams }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute ?? 'Landing'}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="LoadingTransition" component={LoadingTransitionScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="NewsMap" component={MunicipalMapScreen} />
      <Stack.Screen name="Directory" component={DirectoryScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        initialParams={initialRoute === 'VerifyEmail' ? initialParams : undefined}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        initialParams={initialRoute === 'ResetPassword' ? initialParams : undefined}
      />
      <Stack.Screen name="ResendVerification" component={ResendVerificationScreen} />
    </Stack.Navigator>
  );
}
