import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView, // Use ScrollView for potentially long descriptions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import config from '../../../constants/config.json';
const BASE_URL = config.BASE_URL;


// Interface for the detailed place data fetched from the new endpoint
interface PlaceDetails {
  place_place_id: string; // PK (Tourist Spot ID)
  place_id: string; // FK (Parent City ID)
  place_name: string;
  description: string;
  address: string;
  business_status: string;
  ratings: number | null;
  type: string[]; // Array of type strings
  total_user_rating: number;
  timing: string[];
  ph_number: string;
  website: string;
  photo_url: string;
  // Add any other fields your backend returns
}

export default function exploreDestinationDetails() {
  // Get the ID passed from the previous screen
  const { placeDetailId } = useLocalSearchParams<{ placeDetailId: string }>();
  const router = useRouter();

  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (placeDetailId) {
      fetchDetails(placeDetailId);
    } else {
      setError("Place ID not provided.");
      setLoading(false);
    }
  }, [placeDetailId]);

  const fetchDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
       // Use your actual backend server address/port
      const res = await fetch(`${BASE_URL}/api/getPlaceDetails/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch details (Status: ${res.status})`);
      }
      const json = await res.json();
      if (json.data) {
        setDetails(json.data);
      } else {
        throw new Error("Place details not found in response.");
      }
    } catch (fetchError: any) {
      console.error("Error fetching place details:", fetchError);
      setError(fetchError.message || "Failed to load place details.");
      setDetails(null); // Clear details on error
    } finally {
      setLoading(false);
    }
  };

  // Function to format types into hashtags
  const renderHashtags = (types: string[] = []) => {
    // Filter out common/unwanted types if necessary
    const relevantTypes = types.filter(t => !['point_of_interest', 'establishment'].includes(t)).slice(0, 5); // Limit tags shown

    return relevantTypes.map((type, index) => (
      <View key={index} style={styles.hashtag}>
        <Text style={styles.hashtagText}>#{type.replace(/_/g, '')}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
         {/* Simple Header for error state */}
         <View style={styles.errorHeader}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
               <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.errorHeaderText}>Error</Text>
         </View>
        <Text style={styles.errorText}>{error || "Could not load place details."}</Text>
        <Pressable onPress={() => placeDetailId && fetchDetails(placeDetailId)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Main component render when data is loaded
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
       <View style={styles.header}>
            <Pressable onPress={() => router.replace('/(tabs)/(results)/exploreDestinationResult')} hitSlop={10}>
               <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            {/* You might want a dynamic title here if available */}
            <Text style={styles.headerTitle} numberOfLines={1}>{details.place_name}</Text>
       </View>

        {/* Scrollable Content Area */}
       <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
         {/* 1. Photo at the top */}
         <Image
            source={details.photo_url ? { uri: details.photo_url } : require('../../../assets/images/placeholder.png')} // Use placeholder
            style={styles.mainImage}
            resizeMode="cover"
         />

         {/* 2. Place Name */}
         <Text style={styles.placeName}>{details.place_name}</Text>

         {/* 3. Description */}
         <Text style={styles.description}>{details.description || 'No description available.'}</Text>

         {/* 4. Bottom section (Hashtags and Rating) */}
         <View style={styles.bottomMeta}>
             {/* Left: Hashtags */}
            <View style={styles.hashtagsContainer}>
               {renderHashtags(details.type)}
            </View>

            {/* Right: Rating */}
            {details.ratings != null && ( // Only show rating if available
                 <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={22} color="#E63946" />
                    <Text style={styles.ratingText}>{details.ratings.toFixed(1)}</Text>
                 </View>
            )}
         </View>

         {/* Add other details like Address, Timings, Phone etc. here if needed */}
         <View style={styles.otherDetails}>
             {details.address && <Text style={styles.detailItem}><MaterialIcons name="location-on" size={16}/> {details.address}</Text>}
             {details.ph_number && <Text style={styles.detailItem}><MaterialIcons name="phone" size={16}/> {details.ph_number}</Text>}
             {details.website && <Text style={styles.detailItem}><MaterialIcons name="public" size={16}/> {details.website}</Text>}
             {/* Consider formatting timings */}
         </View>

       </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B2B5B', // Header color extends to safe area
  },
   // Consistent Header Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2B5B',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 20 : 50,
    paddingBottom: 15,
    gap: 15,
  },
  headerTitle: {
    flex: 1, // Allow title to take space
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5, // Space after back button if title is long
  },
  // ScrollView and Content
  scrollView: {
    flex: 1,
    backgroundColor: '#fff', // White background for content
  },
  scrollContent: {
     paddingBottom: 30, // Space at the bottom
  },
  // Content Elements
  mainImage: {
    width: '100%',
    height: 250, // Adjust height as desired
    marginBottom: 15,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B2B5B',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24, // Improve readability
    marginHorizontal: 15,
    marginBottom: 20,
  },
  // Bottom Meta Section (Hashtags & Rating)
  bottomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Pushes items to ends
    alignItems: 'flex-start', // Align items to top
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  // Hashtags (Left)
  hashtagsContainer: {
    flex: 1, // Allow it to take available space
    flexDirection: 'row', // Layout tags horizontally
    flexWrap: 'wrap', // Allow tags to wrap to next line
    marginRight: 10, // Space between tags and rating
  },
  hashtag: {
    backgroundColor: '#E0E7FF', // Light blue background
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15, // Rounded corners
    marginRight: 6,
    marginBottom: 6, // Spacing for wrapped tags
  },
  hashtagText: {
    color: '#3730A3', // Darker blue text
    fontSize: 13,
    fontWeight: '500',
  },
  // Rating (Right)
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2', // Light red background
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 'auto', // Pushes to the right if hashtags don't fill space
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '700',
    color: '#E63946', // Red text
  },
  // Other Details section
   otherDetails: {
    marginHorizontal: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
  },
  detailItem: {
      fontSize: 15,
      color: '#374151',
      marginBottom: 10,
      lineHeight: 22,
      flexDirection: 'row', // For icon alignment (though not strictly needed for text node)
      alignItems: 'center',
  },
  // Centering for Loading/Error
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Error State Styles
  errorHeader: { // Simple header for error screen
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2B5B',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 20 : 50,
    paddingBottom: 15,
    gap: 15,
  },
  errorHeaderText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#FEE2E2', // Light red text on dark blue bg
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
      backgroundColor: '#E63946',
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 8,
  },
  retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  }
});