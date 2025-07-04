import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

export default function TaskManagementScreen() {
    const {
        selectedOrganization,
        tasks,
        currentTask,
        elapsedTime,
        addTask,
        updateTask,
        deleteTask,
        startTracking,
        stopTracking,
        setElapsedTime,
    } = useAppStore();

    const [taskName, setTaskName] = useState('');
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedTaskForActivity, setSelectedTaskForActivity] = useState<Task | null>(null);

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

    const saveTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name.');
            return;
        }

        if (!selectedOrganization) {
            Alert.alert('Error', 'Please select an organization first.');
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            name: taskName.trim(),
            organization: selectedOrganization,
            startTime: null,
            elapsedTime: 0,
            isTracking: false,
            activities: [],
        };

        addTask(newTask);
        setTaskName('');
        Alert.alert('Success', 'Task saved successfully!');
    };

    const handleStartTracking = (taskId: string) => {
        startTracking(taskId);
        Alert.alert('Tracking Started', 'Task tracking started.');
    };

    const handleStopTracking = () => {
        stopTracking();
        Alert.alert('Tracking Stopped', 'Task tracking stopped.');
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTask(taskId);
        Alert.alert('Success', 'Task deleted successfully!');
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

    const showTaskActivity = (task: Task) => {
        setSelectedTaskForActivity(task);
        console.log(task, 66666);
        setShowActivityModal(true);
    };

    // Helper to get the latest activities for the selected task
    const getSelectedTaskActivities = () => {
        if (!selectedTaskForActivity) {
            console.log('No selectedTaskForActivity', 66666);
            return [];
        }
        const latestTask = tasks.find(t => t.id === selectedTaskForActivity.id);
        console.log('latestTask found:', latestTask, 66666);
        console.log('latestTask activities:', latestTask?.activities, 66666);
        return latestTask?.activities || [];
    };

    const getProgressPercentage = () => {
        const maxTime = 28800; // 8 hours in seconds
        const totalElapsed = (currentTask?.elapsedTime || 0) + elapsedTime;
        return Math.min((totalElapsed / maxTime) * 100, 100);
    };

    const handleGoBack = () => {
        router.back();
    };

    if (!selectedOrganization) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingSection}>
                    <Text style={styles.loadingText}>Loading organization...</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Task Management</Text>
                <Text style={styles.headerSubtitle}>{selectedOrganization.name}</Text>
            </View>

            {/* Current Task Display */}
            {currentTask && (
                <View style={styles.currentTaskSection}>
                    <Text style={styles.sectionTitle}>
                        {currentTask.isTracking ? 'Currently Tracking' : 'Last Tracked Task'}
                    </Text>

                    <View style={styles.taskCard}>
                        <View style={styles.timerContainer}>
                            <View style={styles.timerCircle}>
                                <Svg width={280} height={280} style={styles.timerSvg}>
                                    {/* Outer glow circle */}
                                    <Circle
                                        cx={140}
                                        cy={140}
                                        r={130}
                                        stroke={selectedOrganization.color}
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
                                        stroke={selectedOrganization.color}
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
                                        stroke={selectedOrganization.color}
                                        strokeWidth={1}
                                        fill="transparent"
                                        opacity={0.2}
                                    />
                                </Svg>

                                {/* Timer Text Overlay */}
                                <View style={styles.timerTextOverlay}>
                                    <Text style={styles.timerText}>{formatTime((currentTask.elapsedTime || 0) + elapsedTime)}</Text>
                                    <Text style={styles.timerLabel}>Total Time</Text>
                                    <Text style={styles.timerSubtext}>
                                        {currentTask.isTracking ? 'Tracking...' : 'Paused'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Task Name Display */}
                        <View style={styles.taskNameContainer}>
                            <Text style={styles.taskNameDisplay}>{currentTask.name}</Text>
                            <Text style={styles.taskOrgDisplay}>{currentTask.organization.name}</Text>
                        </View>

                        {currentTask.isTracking ? (
                            <TouchableOpacity
                                style={styles.stopTrackingButton}
                                onPress={handleStopTracking}
                            >
                                <Text style={styles.stopTrackingButtonText}>Stop Tracking</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.startTrackingButton}
                                onPress={() => handleStartTracking(currentTask.id)}
                            >
                                <Text style={styles.startTrackingButtonText}>Start Tracking</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Create New Task */}
            <View style={styles.createTaskSection}>
                <Text style={styles.sectionTitle}>Create New Task</Text>

                <View style={styles.taskInputContainer}>
                    <TextInput
                        style={styles.taskInput}
                        placeholder="Enter task name..."
                        value={taskName}
                        onChangeText={setTaskName}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, !taskName.trim() && styles.saveButtonDisabled]}
                        onPress={saveTask}
                        disabled={!taskName.trim()}
                    >
                        <Text style={styles.saveButtonText}>Save Task</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Saved Tasks List */}
            <View style={styles.savedTasksSection}>
                <Text style={styles.sectionTitle}>Saved Tasks</Text>

                {tasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No saved tasks yet</Text>
                        <Text style={styles.emptyStateSubtext}>Create a task above to get started</Text>
                    </View>
                ) : (
                    <View style={styles.tasksList}>
                        {tasks.map((task) => (
                            <View key={task.id} style={styles.taskItem}>
                                <View style={styles.taskItemContent}>
                                    <View style={styles.taskItemInfo}>
                                        <Text style={styles.taskItemName}>{task.name}</Text>
                                        <Text style={styles.taskItemOrg}>{task.organization.name}</Text>
                                        <Text style={styles.taskItemTime}>
                                            Total: {formatTime(task.elapsedTime)}
                                        </Text>
                                    </View>

                                    <View style={styles.taskItemActions}>
                                        {!task.isTracking ? (
                                            <TouchableOpacity
                                                style={styles.startButton}
                                                onPress={() => handleStartTracking(task.id)}
                                            >
                                                <Text style={styles.startButtonText}>Start</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.trackingIndicator}>
                                                <Text style={styles.trackingText}>Tracking</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            style={styles.activityButton}
                                            onPress={() => showTaskActivity(task)}
                                        >
                                            <Text style={styles.activityButtonText}>Activity</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteTask(task.id)}
                                        >
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {/* Activity Modal */}
            <Modal
                visible={showActivityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowActivityModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedTaskForActivity?.name} - Activity History
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowActivityModal(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
                            {(() => {
                                const activities = getSelectedTaskActivities();
                                console.log('Activities in modal:', activities, 66666);
                                console.log('Activities length:', activities.length, 66666);
                                return activities.length > 0 ? (
                                    activities.map((activity, index) => {
                                        console.log(activity, 66666);
                                        return (
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
                                        )
                                    })
                                ) : (
                                    <View style={styles.emptyActivityState}>
                                        <Text style={styles.emptyActivityText}>No activity recorded yet</Text>
                                        <Text style={styles.emptyActivitySubtext}>
                                            Start tracking this task to see activity history
                                        </Text>
                                    </View>
                                );
                            })()}
                        </ScrollView>
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
        padding: 15,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    currentTaskSection: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        height: 500,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    taskCard: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    taskNameContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    taskNameDisplay: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
        textAlign: 'center',
    },
    taskOrgDisplay: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
    },
    timerCircle: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 280,
        height: 280,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    timerSvg: {
        position: 'absolute',
    },
    timerTextOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    timerText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 6,
        textAlign: 'center',
    },
    timerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
        fontWeight: '600',
    },
    timerSubtext: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    stopTrackingButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    stopTrackingButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    startTrackingButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    startTrackingButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    createTaskSection: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    taskInputContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    taskInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#f8f9fa',
    },
    saveButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    savedTasksSection: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 12,
        color: '#999',
    },
    tasksList: {
        gap: 10,
    },
    taskItem: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f8f9fa',
    },
    taskItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskItemInfo: {
        flex: 1,
    },
    taskItemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    taskItemOrg: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    taskItemTime: {
        fontSize: 11,
        color: '#999',
    },
    taskItemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    startButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignItems: 'center',
    },
    startButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    trackingIndicator: {
        backgroundColor: '#34C759',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignItems: 'center',
    },
    trackingText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    activityButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignItems: 'center',
    },
    activityButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    backButton: {
        backgroundColor: '#8E8E93',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
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
    loadingSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        height: '90%',
        borderRadius: 10,
        width: '80%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 5,
        borderRadius: 5,
        backgroundColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    activityList: {
        flex: 1,
    },
    activityItem: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    activitySession: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    activityDuration: {
        fontSize: 12,
        color: '#666',
    },
    activityDetails: {
        marginTop: 5,
    },
    activityTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    activityTimeLabel: {
        fontSize: 12,
        color: '#666',
        marginRight: 5,
    },
    activityTimeValue: {
        fontSize: 12,
        color: '#1a1a1a',
    },
    emptyActivityState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyActivityText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    emptyActivitySubtext: {
        fontSize: 12,
        color: '#999',
    },
}); 