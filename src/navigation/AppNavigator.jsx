// src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator    from './AuthNavigator';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ProfileScreen    from '../screens/ProfileScreen';
import RequestsScreen   from '../screens/RequestsScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { isDark, theme } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: theme.bgDark },
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main"       component={MainTabNavigator} />
              <Stack.Screen
                name="ChatDetail"
                component={ChatDetailScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen name="Profile"    component={ProfileScreen} />
              <Stack.Screen name="Requests"   component={RequestsScreen} />
              <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
            </>
          ) : (
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{ animationTypeForReplace: 'pop' }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}