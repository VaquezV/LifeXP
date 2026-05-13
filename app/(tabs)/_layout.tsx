import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#05070a',
        },
        tabBarActiveTintColor: '#f5f7fa',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: {
          backgroundColor: '#0b0f14',
          borderTopColor: '#18202a',
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="check-circle" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
