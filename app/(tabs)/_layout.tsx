import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TabBarIconProps {
  color: string;
  size: number;
  focused: boolean;
}

const TabLayout: React.FC = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E63946', // Red for active tab
        tabBarInactiveTintColor: '#4B5563', // Gray for inactive
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false, // Assuming you handle headers within each screen
      }}
    >
      {/* Hide the index route */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Exclude this route from the tabs
        }}
      />
      <Tabs.Screen
        name="homePage"
        options={{
          title: 'Home', // Label shown on the tab
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile', // Label shown on the tab
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Hide exploreDestination from the footer */}
      <Tabs.Screen
        name="(intermediate)/exploreDestination"
        options={{
          href: null, // Exclude this route from the tabs
        }}
      />
      {/* Hide exploreResult from the footer */}
      <Tabs.Screen
        name="(results)/exploreDestinationResult"
        options={{
          href: null, // Exclude this route from the tabs
        }}
      />

      {/* Hide exploredestinationDetails from the footer */}
      <Tabs.Screen
        name="(results)/exploreDestinationDetails"
        options={{
          href: null, // Exclude this route from the tabs
        }}
      />
    </Tabs>
  );
};

export default TabLayout;