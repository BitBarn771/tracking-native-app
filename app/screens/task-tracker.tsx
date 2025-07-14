import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import trackerService from '../../services/trackerService';
import { TaskActivity, useAppStore } from '../../store/useAppStore';

interface Organization {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface Task {
    id: string;
    name: string;
    organization: Organization;
    startTime: Date | null;
    elapsedTime: number;
    isTracking: boolean;
    activities: TaskActivity[];
}

interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: number;
}

export default function TaskTrackerScreen() {
    const {
        selectedOrganization,
        tasks,
        currentTask,
        elapsedTime,
        startTracking,
        stopTracking,
        setElapsedTime,
    } = useAppStore();

    const [currentTaskLocal, setCurrentTaskLocal] = useState<any>(null);
    const [initialLocation, setInitialLocation] = useState<LocationPoint | null>(null);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [isLocationSynced, setIsLocationSynced] = useState(false);
    const [trackingStartDate, setTrackingStartDate] = useState<Date | null>(null);

    // Function to calculate distance between two points in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Function to start location tracking
    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const initialPoint: LocationPoint = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp,
            };
            setInitialLocation(initialPoint);
            setIsLocationSynced(true);

            // Save the start date when tracking begins
            setTrackingStartDate(new Date());

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                async (newLocation) => {
                    if (initialPoint) {
                        const distance = calculateDistance(
                            initialPoint.latitude,
                            initialPoint.longitude,
                            newLocation.coords.latitude,
                            newLocation.coords.longitude
                        );

                        if (distance > 250) {
                            stopTracking();
                            setIsLocationSynced(false);
                            subscription.remove();
                            setLocationSubscription(null);
                            alert('Tracking stopped: You have moved more than 250m from the initial location');
                            // Call /create endpoint with startDate and endDate
                            if (trackingStartDate) {
                                await trackerService.createTracker(trackingStartDate, new Date());
                            }
                        }
                    }
                }
            );

            setLocationSubscription(subscription);
        } catch (error) {
            console.error('Error starting location tracking:', error);
        }
    };

    // Clean up location subscription
    useEffect(() => {
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [locationSubscription]);

    useEffect(() => {
        // Find the hardcoded task
        const hardcodedTask = tasks.find(task => task.id === 'hardcoded-task-1');
        if (hardcodedTask) {
            setCurrentTaskLocal(hardcodedTask);
        }
    }, [tasks]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (currentTask?.isTracking && currentTask.startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - currentTask.startTime!.getTime()) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [currentTask?.isTracking, currentTask?.startTime, setElapsedTime]);

    const handleStartTracking = async () => {
        if (currentTaskLocal) {
            await startLocationTracking();
            startTracking(currentTaskLocal.id);
        }
    };

    const handleStopTracking = () => {
        stopTracking();
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
        }
        setIsLocationSynced(false);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getProgressPercentage = () => {
        const maxTime = 28800; // 8 hours in seconds
        const totalElapsed = (currentTask?.elapsedTime || 0) + elapsedTime;
        return Math.min((totalElapsed / maxTime) * 100, 100);
    };

    const handleGoBack = () => {
        router.back();
    };

    if (!currentTaskLocal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingSection}>
                    <Text style={styles.loadingText}>Loading task...</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⏱️ Time Tracker</Text>
                <Text style={styles.headerSubtitle}>
                    {currentTaskLocal.name} - {currentTaskLocal.organization.name}
                </Text>
            </View>

            {/* Timer Circle */}
            <View style={styles.timerSection}>
                <View style={styles.timerContainer}>
                    <View style={styles.timerCircle}>
                        <Svg width={280} height={280} style={styles.timerSvg}>
                            {/* Outer glow circle */}
                            <Circle
                                cx={140}
                                cy={140}
                                r={130}
                                stroke={currentTaskLocal.organization.color}
                                strokeWidth={2}
                                fill="transparent"
                                opacity={0.3}
                            />
                            {/* Background circle */}
                            <Circle
                                cx={140}
                                cy={140}
                                r={120}
                                stroke="#F0F0F0"
                                strokeWidth={16}
                                fill="transparent"
                            />
                            {/* Progress circle */}
                            <Circle
                                cx={140}
                                cy={140}
                                r={120}
                                stroke={currentTaskLocal.organization.color}
                                strokeWidth={16}
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 120}`}
                                strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgressPercentage() / 100)}`}
                                strokeLinecap="round"
                                transform={`rotate(-90 140 140)`}
                            />
                            {/* Inner accent circle */}
                            <Circle
                                cx={140}
                                cy={140}
                                r={100}
                                stroke={currentTaskLocal.organization.color}
                                strokeWidth={1}
                                fill="transparent"
                                opacity={0.2}
                            />
                        </Svg>

                        {/* Timer Text Overlay */}
                        <View style={styles.timerTextOverlay}>
                            <Text style={styles.timerText}>
                                {formatTime((currentTask?.elapsedTime || 0) + elapsedTime)}
                            </Text>
                            <Text style={styles.timerLabel}>Total Time</Text>
                            <Text style={styles.timerSubtext}>
                                {currentTask?.isTracking ? 'Tracking...' : 'Paused'}
                            </Text>
                            {isLocationSynced && (
                                <View style={styles.locationSyncContainer}>
                                    <Text style={styles.locationSyncText}>📍 Location Synced</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Control Buttons */}
                <View style={styles.controls}>
                    {currentTask?.isTracking ? (
                        <>
                            <TouchableOpacity
                                style={styles.stopButton}
                                onPress={handleStopTracking}
                            >
                                <Text style={styles.buttonText}>Stop Tracking</Text>
                            </TouchableOpacity>
                            {isLocationSynced && (
                                <Text style={styles.locationTrackingText}>
                                    tracking location
                                </Text>
                            )}
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStartTracking}
                        >
                            <Text style={styles.buttonText}>Start Tracking</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Activity Log */}
            <View style={styles.activitySection}>
                <Text style={styles.sectionTitle}>Activity Log</Text>

                {currentTask && currentTask.activities && currentTask.activities.length > 0 ? (
                    <ScrollView
                        style={styles.activityList}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.activityListContent}
                        nestedScrollEnabled={true}
                    >
                        {currentTask.activities.map((activity, index) => (
                            <View key={activity.id} style={styles.activityItem}>
                                <View style={styles.activityHeader}>
                                    <Text style={styles.activitySession}>Session {index + 1}</Text>
                                    <Text style={styles.activityDuration}>
                                        {formatTime(activity.duration)}
                                    </Text>
                                </View>

                                <View style={styles.activityDetails}>
                                    <View style={styles.activityTimeRow}>
                                        <Text style={styles.activityTimeLabel}>Started:</Text>
                                        <Text style={styles.activityTimeValue}>
                                            {formatDateTime(activity.startTime)}
                                        </Text>
                                    </View>

                                    <View style={styles.activityTimeRow}>
                                        <Text style={styles.activityTimeLabel}>Ended:</Text>
                                        <Text style={styles.activityTimeValue}>
                                            {activity.endTime ? formatDateTime(activity.endTime) : 'In Progress'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyActivityState}>
                        <Text style={styles.emptyActivityText}>No activity recorded yet</Text>
                        <Text style={styles.emptyActivitySubtext}>
                            Start tracking to see activity history
                        </Text>
                    </View>
                )}
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    timerSection: {
        alignItems: 'center',
        marginBottom: 20,
        flexShrink: 0,
    },
    timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        height: 280,
    },
    timerCircle: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 280,
        height: 280,
    },
    timerSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    timerTextOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    timerText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    timerLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    timerSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    controls: {
        alignItems: 'center',
        gap: 15,
    },
    startButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    stopButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activitySection: {
        flex: 1,
        minHeight: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 15,
    },
    activityList: {
        flex: 1,
        minHeight: 0,
    },
    activityListContent: {
        gap: 10,
        paddingBottom: 20,
    },
    activityItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activitySession: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    activityDuration: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    activityDetails: {
        marginTop: 5,
    },
    activityTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    activityTimeLabel: {
        fontSize: 14,
        color: '#666',
    },
    activityTimeValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    emptyActivityState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyActivityText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 10,
    },
    emptyActivitySubtext: {
        fontSize: 14,
        color: '#999',
    },
    loadingSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#8E8E93',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    locationSyncContainer: {
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    locationSyncText: {
        fontSize: 12,
        color: '#34C759',
        fontWeight: '600',
    },
    locationTrackingText: {
        fontSize: 12,
        color: '#34C759',
        marginTop: 8,
        fontStyle: 'italic',
    },
}); 