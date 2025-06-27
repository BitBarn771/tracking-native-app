import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export default function LocationTracker() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [savedLocation, setSavedLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [updateCount, setUpdateCount] = useState(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track your position.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
      });
      
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };
      
      console.log('Current location:', locationData);
      setCurrentLocation(locationData);
      
      // Check distance if we have a saved location
      if (savedLocation) {
        const distanceMeters = calculateDistance(locationData, savedLocation);
        setDistance(distanceMeters);
        
        // Only alert if distance > 20m and we haven't alerted in the last 30 seconds
        const now = Date.now();
        if (distanceMeters > 20 && (now - lastAlertTime) > 30000) {
          setLastAlertTime(now);
          Alert.alert(
            'Location Alert!',
            `You have moved ${distanceMeters.toFixed(1)} meters from your saved location.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const startLocationTracking = async () => {
    if (!hasPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      console.log('Starting location tracking...');
      setIsTracking(true);
      setUpdateCount(0);
      
      // First get initial location
      await getCurrentLocation();
      
      // Start continuous tracking
     locationSubscription.current = await Location.watchPositionAsync(
  {
    accuracy: Location.Accuracy.Highest, // Use Highest for more frequent updates
    timeInterval: 1000, // 1 second
    distanceInterval: 0, // Ignore distance
  },
        (location) => {
          console.log('Location update received:', location.coords);
          setUpdateCount(prev => prev + 1);
          
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
          };
          
          console.log('Updated location data:', locationData);
          setCurrentLocation(locationData);
          
          // Check distance if we have a saved location
          if (savedLocation) {
            const distanceMeters = calculateDistance(locationData, savedLocation);
            setDistance(distanceMeters);
            console.log('Distance from saved location:', distanceMeters, 'meters');
            
            // Only alert if distance > 20m and we haven't alerted in the last 30 seconds
            const now = Date.now();
            if (distanceMeters > 20 && (now - lastAlertTime) > 30000) {
              setLastAlertTime(now);
              Alert.alert(
                'Location Alert!',
                `You have moved ${distanceMeters.toFixed(1)} meters from your saved location.`,
                [{ text: 'OK' }]
              );
            }
          }
        }
      );
      
      console.log('Location tracking started successfully');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Could not start location tracking.');
      setIsTracking(false);
    }
  };

  const stopLocationTracking = () => {
    console.log('Stopping location tracking...');
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  const saveCurrentLocation = () => {
    if (currentLocation) {
      setSavedLocation(currentLocation);
      setDistance(0);
      setLastAlertTime(0); // Reset alert timer
      console.log('Location saved:', currentLocation);
      Alert.alert('Location Saved', 'Your current location has been saved as the reference point.');
    } else {
      Alert.alert('No Location', 'Please get your current location first.');
    }
  };

  const clearSavedLocation = () => {
    setSavedLocation(null);
    setDistance(null);
    setLastAlertTime(0);
    console.log('Saved location cleared');
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (loc1: LocationData, loc2: LocationData): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatLocation = (location: LocationData) => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Track your location and get alerts when you move
        </Text>
      </View>

      {/* Current Location Display */}
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>Current Location</Text>
        {currentLocation ? (
          <>
            <Text style={styles.coordinates}>{formatLocation(currentLocation)}</Text>
            <Text style={styles.timestamp}>
              Updated: {formatTimestamp(currentLocation.timestamp)}
            </Text>
            {currentLocation.accuracy && (
              <Text style={styles.accuracy}>
                Accuracy: ±{currentLocation.accuracy.toFixed(1)}m
              </Text>
            )}
            {isTracking && (
              <Text style={styles.updateCount}>
                Updates: {updateCount}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noData}>No location data</Text>
        )}
      </View>

      {/* Saved Location Display */}
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>Saved Location</Text>
        {savedLocation ? (
          <>
            <Text style={styles.coordinates}>{formatLocation(savedLocation)}</Text>
            <Text style={styles.timestamp}>
              Saved: {formatTimestamp(savedLocation.timestamp)}
            </Text>
            {distance !== null && (
              <Text style={[styles.distance, distance > 20 && styles.distanceAlert]}>
                Distance: {distance.toFixed(1)}m
                {distance > 20 && ' ⚠️'}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noData}>No saved location</Text>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.getLocationButton]}
          onPress={getCurrentLocation}
        >
          <Text style={styles.buttonText}>📍 Get Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveCurrentLocation}
          disabled={!currentLocation}
        >
          <Text style={styles.buttonText}>💾 Save Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
          onPress={isTracking ? stopLocationTracking : startLocationTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
          </Text>
        </TouchableOpacity>

        {savedLocation && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearSavedLocation}
          >
            <Text style={styles.buttonText}>🗑️ Clear Saved</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isTracking 
            ? '🟢 Location tracking is active'
            : '🔴 Location tracking is stopped'
          }
        </Text>
        {distance !== null && distance > 20 && (
          <Text style={styles.alertText}>
            ⚠️ You are more than 20m from your saved location!
          </Text>
        )}
        {isTracking && (
          <Text style={styles.trackingInfo}>
            Updates every 3 seconds or 1 meter of movement
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  accuracy: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  updateCount: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  distance: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: 'bold',
  },
  distanceAlert: {
    color: '#FF3B30',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  controls: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getLocationButton: {
    backgroundColor: '#34C759',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  startButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: 'bold',
    marginTop: 5,
  },
  trackingInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
}); 