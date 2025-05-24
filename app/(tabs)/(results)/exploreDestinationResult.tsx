import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import config from '../../../constants/config.json';
const BASE_URL = config.BASE_URL;

interface Place {
  place_id: string;
  place_name: string;
  description: string;
  ratings: number;
  photo_url: string;
}

export default function ExploreDestinationResult() {
  const { placeId, cityName } = useLocalSearchParams<{
    placeId: string;
    cityName: string;
  }>();
  const router = useRouter();

  const [places, setPlaces] = useState<Place[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (placeId && cityName) {
      fetchResults();
    }
  }, [placeId, cityName]);

  const fetchResults = async () => {
    setIsFetching(true);
    // only show spinner if it takes longer than 300ms:
    const timer = setTimeout(() => setShowSpinner(true), 300);

    try {
      const res = await fetch(
        `${BASE_URL}/api/buildExploreDestinationResult`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId, cityName }),
        }
      );
      const json = await res.json();
      setPlaces(json.data || []);
    } catch (err) {
      console.error('❌ Error fetching places:', err);
      setPlaces([]);
    } finally {
      clearTimeout(timer);
      setIsFetching(false);
      setShowSpinner(false);
    }
  };

  const clearFilters = () => {
    setPlaces([]);
  };

  // --- Render helpers ---
  const Header = () => (
    <View style={styles.header}>
      <Pressable
        onPress={() =>
          router.replace('/(tabs)/(intermediate)/exploreDestination')
        }
        hitSlop={10}
      >
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </Pressable>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>{cityName}</Text>
      </View>
    </View>
  );

  const FilterBar = () => (
    <View style={styles.filterBar}>
          {/* static “Clear Filters” label — no onPress */}
          <View style={styles.clearFiltersContainer}>
            <MaterialIcons name="clear" size={16} color="#0B2B5B" />
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </View>
          <Pressable onPress={() => console.log('Open filters')}>
            <MaterialIcons name="filter-list" size={24} color="#0B2B5B" />
          </Pressable>
    </View>
  );

  const renderPlace = ({ item }: { item: Place }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/(results)/exploreDestinationDetails',
          params: { placeDetailId: item.place_id },
        })
      }
    >
      <Image
        source={
          item.photo_url
            ? { uri: item.photo_url }
            : require('../../../assets/images/placeholder.png')
        }
        style={styles.cardImage}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.place_name}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.meta}>
          <MaterialIcons name="star" size={16} color="#E63946" />
          <Text style={styles.rating}>
            {item.ratings != null ? item.ratings.toFixed(1) : '—'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  // --- Final render ---

  return (
    <>
      {/* 1️⃣ Blue notch + header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <Header />
      </SafeAreaView>

      {/* 2️⃣ White content container */}
      <SafeAreaView style={styles.contentSafeArea}>
        <FilterBar />

        {isFetching && showSpinner ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0B2B5B" />
            <Text style={styles.loadingText}>Searching for places…</Text>
          </View>
        ) : places.length === 0 ? (
          <View style={styles.center}>
            <MaterialIcons name="place" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No places found.</Text>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(p) => p.place_id}
            renderItem={renderPlace}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: '#0B2B5B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2B5B',
    paddingTop: Platform.OS === 'android' ? 20 : 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSub: {
    color: '#E0E0E0',
    fontSize: 14,
    marginTop: 2,
  },

  contentSafeArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: -10,
    overflow: 'hidden',
  },

  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clearFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFiltersText: {
    marginLeft: 4,
    color: '#0B2B5B',
    fontSize: 14,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0B2B5B',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 18,
    color: '#6B7280',
  },

  list: {
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B2B5B',
  },
  cardDesc: {
    fontSize: 14,
    color: '#4B5563',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#0B2B5B',
  },
});
