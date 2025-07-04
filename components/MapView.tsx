import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEFAULT_MAP_SETTINGS, MAPBOX_ACCESS_TOKEN } from '../constants/MapboxConfig';

// Set the Mapbox access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

interface MapViewProps {
  onPolygonComplete?: (coordinates: number[][]) => void;
}

export default function MapView({ onPolygonComplete }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef<Mapbox.MapView>(null);

  // Request location permissions and get user location
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show your position on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation([longitude, latitude]);
      
      // Center map on user location
      if (mapRef.current) {
        mapRef.current.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setPolygonPoints([]);
  };

  const stopDrawing = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawing(false);
      if (onPolygonComplete) {
        onPolygonComplete(polygonPoints);
      }
    } else {
      Alert.alert('Invalid Polygon', 'A polygon must have at least 3 points.');
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    setIsDrawing(false);
  };

  const onMapPress = (event: any) => {
    if (isDrawing) {
      const { coordinates } = event.geometry;
      setPolygonPoints(prev => [...prev, coordinates]);
    }
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={DEFAULT_MAP_SETTINGS.style}
        onMapIdle={() => {
          // Map is ready
        }}
        onTouch={onMapPress}
      >
        {/* User location marker */}
        {userLocation && (
          <Mapbox.PointAnnotation
            id="userLocation"
            coordinate={userLocation}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Polygon being drawn */}
        {polygonPoints.length > 0 && (
          <Mapbox.ShapeSource
            id="polygonSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [polygonPoints],
              },
              properties: {},
            }}
          >
            <Mapbox.FillLayer
              id="polygonFill"
              style={{
                fillColor: '#007AFF',
                fillOpacity: 0.3,
              }}
            />
            <Mapbox.LineLayer
              id="polygonOutline"
              style={{
                lineColor: '#007AFF',
                lineWidth: 2,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Polygon points */}
        {polygonPoints.map((point, index) => (
          <Mapbox.PointAnnotation
            key={`point-${index}`}
            id={`point-${index}`}
            coordinate={point}
          >
            <View style={styles.polygonPointMarker}>
              <Text style={styles.pointNumber}>{index + 1}</Text>
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.locationButton]}
          onPress={getCurrentLocation}
        >
          <Text style={styles.buttonText}>📍</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isDrawing ? styles.stopButton : styles.startButton]}
          onPress={isDrawing ? stopDrawing : startDrawing}
        >
          <Text style={styles.buttonText}>
            {isDrawing ? '✓ Done' : '✏️ Draw'}
          </Text>
        </TouchableOpacity>

        {polygonPoints.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearPolygon}
          >
            <Text style={styles.buttonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isDrawing 
            ? `Drawing polygon... (${polygonPoints.length} points)`
            : polygonPoints.length > 0 
              ? `Polygon with ${polygonPoints.length} points`
              : 'Tap "Draw" to start drawing a polygon around your property'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 10,
  },
  button: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    backgroundColor: '#34C759',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  polygonPointMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 
