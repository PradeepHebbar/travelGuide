import 'react-native-get-random-values';
import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';


interface CardInfo {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  buttonText: string;
  route: string;
}

const cardData: CardInfo[] = [
    // ... (keep the same card data as before)
  {
    iconName: 'map-marker-outline',
    title: 'Explore Destination',
    subtitle: 'Browse places to visit',
    buttonText: 'Explore',
    route: '/exploreDestination',
  },
  {
    iconName: 'swap-horizontal',
    title: 'Discover En Route',
    subtitle: 'Find stops along the way',
    buttonText: 'Discover',
    route: '../../test/MinimalPlaces',
  },
  {
    iconName: 'map-legend',
    title: 'Get Suggested Itineraries',
    subtitle: 'Get curated trip plans',
    buttonText: 'Get Started',
    route: '/suggested',
  },
  {
    iconName: 'pencil-outline',
    title: 'Build Custom Itinerary',
    subtitle: 'Create your own plans',
    buttonText: 'Build',
    route: '/custom',
  },
];

const HomePage: React.FC = () => {
  const router = useRouter();

  return (
    // Use SafeAreaView to avoid status bar overlap
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Increased marginBottom for more space after header */}
        <Text style={styles.header}>Hello, Pradeep!</Text>

        {cardData.map((card, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconTextContainer}>
                 {/* Increased icon size */}
                <MaterialCommunityIcons name={card.iconName} size={32} color="#0B2B5B" style={styles.icon} />
                <View style={styles.textContainer}>
                   {/* Increased text sizes */}
                  <Text style={styles.title}>{card.title}</Text>
                  <Text style={styles.subtitle}>{card.subtitle}</Text>
                </View>
              </View>
              <Pressable style={styles.button} onPress={() => router.push(card.route as `/${string}`)}>
                <Text style={styles.buttonText}>{card.buttonText}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Background color for the safe area
  },
  container: {
    flex: 1,
    paddingHorizontal: 15, // Reduced horizontal padding to make cards wider
    paddingTop: 20, // Reduced top padding (SafeAreaView handles status bar)
    paddingBottom: 20,
    // backgroundColor: '#fff', // Moved to safeArea
  },
  header: {
    fontSize: 28, // Increased font size
    fontWeight: '700', // Made slightly bolder if font supports it
    marginBottom: 35, // Increased bottom margin for more space
    color: '#0B2B5B',
    marginTop: 10, // Added top margin for space below status bar
  },
  card: {
    backgroundColor: '#F9FAFB',
    // Optional: Blue border as requested
    borderWidth: 1.5, // Increased border width slightly
    borderColor: '#0B2B5B', // Changed border to dark blue
    // --- Remove above borderWidth/borderColor if you don't want the blue border ---
    // --- Or keep the original light border:
    // borderWidth: 1,
    // borderColor: '#D1D5DB',
    borderRadius: 12, // Slightly increased radius
    padding: 18, // Adjusted padding
    marginBottom: 15, // Reduced space between cards
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardContent: {},
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18, // Adjusted space
  },
  icon: {
    marginRight: 18, // Adjusted space
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18, // Increased size
    fontWeight: '600',
    color: '#0B2B5B',
    marginBottom: 4, // Adjusted spacing
  },
  subtitle: {
    fontSize: 15, // Increased size
    color: '#4B5563',
  },
  button: {
    backgroundColor: '#0B2B5B',
    paddingVertical: 10, // Adjusted padding
    paddingHorizontal: 20, // Adjusted padding
    borderRadius: 8, // Slightly increased radius
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15, // Increased size
  },
});

export default HomePage;