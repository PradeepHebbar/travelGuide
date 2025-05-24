import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import config from '../../../constants/config.json';

const BASE_URL = config.BASE_URL;
const GOOGLE_MAPS_API_KEY = config.GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

export default function ExploreDestination() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<
    Array<{ place_id: string; description: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  // clear on each focus
  useFocusEffect(
    React.useCallback(() => {
      setQuery('');
      setPredictions([]);
      Keyboard.dismiss();
    }, [])
  );

  const fetchPredictions = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${AUTOCOMPLETE_URL}?input=${encodeURIComponent(text)}` +
        `&key=${GOOGLE_MAPS_API_KEY}` +
        `&components=country:in` +
        `&types=(cities)`
      );
      const json = await res.json();
      setPredictions(json.status === 'OK' ? json.predictions : []);
    } catch (e) {
      console.warn('Network error fetching predictions', e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = async (place_id: string, description: string) => {
    Keyboard.dismiss();
    setQuery(description);
    setPredictions([]);

    try {
      const resp = await fetch(`${BASE_URL}/api/buildExploreDestinationResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: place_id, cityName: description }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || `Status ${resp.status}`);
      }
      router.push({
        pathname: '/(tabs)/(results)/exploreDestinationResult',
        params: { placeId: place_id, cityName: description },
      });
    } catch (err: any) {
      console.error('Backend error', err);
      Alert.alert('Error', 'Could not load places. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/homePage')} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Destination</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="search" size={26} color="#6B7280" style={{ marginRight: 10 }} />
          <TextInput
            value={query}
            onChangeText={fetchPredictions}
            placeholder="Search city"
            style={styles.textInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading && <ActivityIndicator style={{ marginLeft: 10 }} size="small" color="#0B2B5B" />}
        </View>

        {predictions.length > 0 && (
          <FlatList
            data={predictions}
            keyExtractor={item => item.place_id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleSelect(item.place_id, item.description)}
              >
                <Text style={styles.rowText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B2B5B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2B5B',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginLeft: 15 },
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: { flex: 1, fontSize: 16, color: '#111827' },
  list: {
    marginTop: 5,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowText: { fontSize: 16, color: '#111827' },
});
