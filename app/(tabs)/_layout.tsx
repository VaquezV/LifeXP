import { useAppTheme } from '@/hooks/use-app-theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      initialRouteName="profile"
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Sanctuaire',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="paw" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="hexagram" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Performances',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="trending-up" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
