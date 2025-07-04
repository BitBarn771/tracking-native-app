import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

interface TaskData {
  organization: string;
  taskName: string;
  startTime?: number;
}

interface Organization {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface LocationTrackerProps {
  selectedOrganization?: Organization | null;
  taskName?: string;
  onStartTracking?: () => void;
}

export default function LocationTracker({
  selectedOrganization,
  taskName,
  onStartTracking
}: LocationTrackerProps = {}) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [savedLocation, setSavedLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [taskData, setTaskData] = useState<TaskData>({ organization: '', taskName: '' });
  const [showTrackingAnimation, setShowTrackingAnimation] = useState(false);
  const [trackingAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [rotationAnimation] = useState(new Animated.Value(0));
  const [progressAnimation] = useState(new Animated.Value(0));

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Enhanced organizations with icons and colors
  const organizations: Organization[] = [
    { id: 'work', name: 'Work', icon: '💼', color: '#007AFF' },
    { id: 'personal', name: 'Personal', icon: '🏠', color: '#34C759' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#FF9500' },
    { id: 'fitness', name: 'Fitness', icon: '💪', color: '#FF3B30' },
    { id: 'shopping', name: 'Shopping', icon: '🛒', color: '#AF52DE' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#FF2D92' },
    { id: 'education', name: 'Education', icon: '📚', color: '#5856D6' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#FF6B35' },
    { id: 'other', name: 'Other', icon: '📌', color: '#8E8E93' },
  ];

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Enhanced tracking animations
  const startTrackingAnimation = () => {
    setShowTrackingAnimation(true);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotationAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Fade in animation
    Animated.timing(trackingAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const stopTrackingAnimation = () => {
    Animated.timing(trackingAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTrackingAnimation(false);
      pulseAnimation.setValue(1);
      rotationAnimation.setValue(0);
      progressAnimation.setValue(0);
    });
  };

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

      if (savedLocation) {
        const distanceMeters = calculateDistance(locationData, savedLocation);
        setDistance(distanceMeters);

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

  const handleStartTracking = () => {
    // If we have props from parent, use those
    if (selectedOrganization && taskName) {
      setTaskData({
        organization: selectedOrganization.id,
        taskName: taskName,
        startTime: Date.now()
      });
      startTrackingAnimation();
      setTimeout(() => {
        startLocationTracking();
      }, 1000);
      return;
    }

    // Otherwise use the modal approach
    if (!taskData.organization || !taskData.taskName) {
      Alert.alert('Setup Required', 'Please select an organization and enter a task name.');
      setShowSetupModal(true);
      return;
    }

    startTrackingAnimation();
    setTimeout(() => {
      startLocationTracking();
    }, 1000);
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
      setTaskData(prev => ({ ...prev, startTime: Date.now() }));
      await getCurrentLocation();

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 0,
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

          if (savedLocation) {
            const distanceMeters = calculateDistance(locationData, savedLocation);
            setDistance(distanceMeters);

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
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Could not start location tracking.');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    stopTrackingAnimation();
  };

  const saveCurrentLocation = () => {
    if (currentLocation) {
      setSavedLocation(currentLocation);
      Alert.alert('Success', 'Location saved successfully!');
    }
  };

  const clearSavedLocation = () => {
    setSavedLocation(null);
    setDistance(null);
  };

  const calculateDistance = (loc1: LocationData, loc2: LocationData): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatLocation = (location: LocationData) => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSelectedOrganization = () => {
    return organizations.find(org => org.id === taskData.organization);
  };

  const spin = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Tracking Animation Overlay */}
      {showTrackingAnimation && (
        <Animated.View
          style={[
            styles.trackingOverlay,
            {
              opacity: trackingAnimation,
            }
          ]}
        >
          <View style={styles.trackingContent}>
            <Animated.View
              style={[
                styles.trackingRing,
                {
                  transform: [{ scale: pulseAnimation }, { rotate: spin }],
                }
              ]}
            >
              <Svg width="120" height="120" viewBox="0 0 120 120">
                <Defs>
                  <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#007AFF" />
                    <Stop offset="100%" stopColor="#5856D6" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                />
                <Circle cx="60" cy="60" r="40" fill="url(#gradient)" />
                <Text style={styles.trackingIcon}>📍</Text>
              </Svg>
            </Animated.View>
            <Text style={styles.trackingLabel}>Tracking Active</Text>
            <Text style={styles.trackingSubtext}>Location updates every second</Text>
          </View>
        </Animated.View>
      )}

      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Location Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Track your location with beautiful animations
        </Text>
      </View>

      {/* Enhanced Task Info Display */}
      {isTracking && taskData.organization && taskData.taskName && (
        <View style={[styles.taskCard, { borderLeftColor: getSelectedOrganization()?.color }]}>
          <Text style={styles.cardTitle}>Current Task</Text>
          <View style={styles.taskInfo}>
            <Text style={styles.taskIcon}>{getSelectedOrganization()?.icon}</Text>
            <View style={styles.taskDetails}>
              <Text style={styles.taskOrganization}>{getSelectedOrganization()?.name}</Text>
              <Text style={styles.taskName}>{taskData.taskName}</Text>
              {taskData.startTime && (
                <Text style={styles.taskDuration}>
                  ⏱️ {formatDuration(taskData.startTime)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Enhanced Location Cards */}
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>📍 Current Location</Text>
        {currentLocation ? (
          <View style={styles.locationInfo}>
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
          </View>
        ) : (
          <Text style={styles.noData}>No location data</Text>
        )}
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>💾 Saved Location</Text>
        {savedLocation ? (
          <View style={styles.locationInfo}>
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
          </View>
        ) : (
          <Text style={styles.noData}>No saved location</Text>
        )}
      </View>

      {/* Enhanced Control Buttons */}
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
          onPress={isTracking ? stopLocationTracking : handleStartTracking}
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

      {/* Enhanced Status */}
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
            Updates every 1 second or 1 meter of movement
          </Text>
        )}
      </View>

      {/* Enhanced Setup Modal */}
      <Modal
        visible={showSetupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 Setup Tracking</Text>
            <Text style={styles.modalSubtitle}>Choose organization and task name</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Organization:</Text>
              <View style={styles.organizationGrid}>
                {organizations.map((org) => (
                  <TouchableOpacity
                    key={org.id}
                    style={[
                      styles.orgButton,
                      taskData.organization === org.id && styles.orgButtonSelected,
                      { borderColor: org.color }
                    ]}
                    onPress={() => setTaskData(prev => ({ ...prev, organization: org.id }))}
                  >
                    <Text style={styles.orgIcon}>{org.icon}</Text>
                    <Text style={[
                      styles.orgButtonText,
                      taskData.organization === org.id && styles.orgButtonTextSelected
                    ]}>
                      {org.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Name:</Text>
              <TextInput
                style={styles.textInput}
                value={taskData.taskName}
                onChangeText={(text) => setTaskData(prev => ({ ...prev, taskName: text }))}
                placeholder="Enter task name..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (taskData.organization && taskData.taskName) {
                    setShowSetupModal(false);
                    handleStartTracking();
                  } else {
                    Alert.alert('Missing Info', 'Please select an organization and enter a task name.');
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Start Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  locationInfo: {
    gap: 8,
  },
  coordinates: {
    fontSize: 18,
    color: '#007AFF',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 16,
    color: '#666',
  },
  accuracy: {
    fontSize: 16,
    color: '#666',
  },
  updateCount: {
    fontSize: 16,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  distance: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: 'bold',
  },
  distanceAlert: {
    color: '#FF3B30',
  },
  noData: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  controls: {
    gap: 15,
    marginBottom: 25,
  },
  button: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 18,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  alertText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
    marginTop: 8,
  },
  trackingInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  taskIcon: {
    fontSize: 32,
  },
  taskDetails: {
    flex: 1,
  },
  taskOrganization: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDuration: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  organizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  orgButton: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minWidth: 100,
  },
  orgButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  orgIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  orgButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orgButtonTextSelected: {
    color: 'white',
  },
  textInput: {
    padding: 15,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  modalButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  trackingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  trackingContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  trackingRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingIcon: {
    fontSize: 32,
    color: 'white',
    position: 'absolute',
  },
  trackingLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
  },
  trackingSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
}); 