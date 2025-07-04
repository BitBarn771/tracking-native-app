import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function OrganizationDetailsScreen() {
    const {
        selectedOrganization,
        organizations,
        setSelectedOrganization
    } = useAppStore();

    const [showChangeModal, setShowChangeModal] = useState(false);
    const [tempSelectedOrg, setTempSelectedOrg] = useState<any>(null);
    const [taskName, setTaskName] = useState('');
    const [isTaskStarted, setIsTaskStarted] = useState(false);
    const [taskStartTime, setTaskStartTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isTaskStarted && taskStartTime) {
            interval = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - taskStartTime.getTime()) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isTaskStarted, taskStartTime]);

    const handleChangeOrganization = () => {
        setTempSelectedOrg(selectedOrganization);
        setShowChangeModal(true);
    };

    const handleConfirmChange = async () => {
        if (!tempSelectedOrg) {
            Alert.alert('Error', 'Please select an organization.');
            return;
        }

        setSelectedOrganization(tempSelectedOrg);
        setShowChangeModal(false);
        setTempSelectedOrg(null);
        Alert.alert('Success', `Organization changed to ${tempSelectedOrg.name}`);
    };

    const handleStartTask = () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name.');
            return;
        }

        setIsTaskStarted(true);
        setTaskStartTime(new Date());
        setElapsedTime(0);
        Alert.alert('Task Started', `Task "${taskName}" has been started for ${selectedOrganization?.name}`);
    };

    const handleStopTask = () => {
        setIsTaskStarted(false);
        setTaskName('');
        setTaskStartTime(null);
        setElapsedTime(0);
        Alert.alert('Task Stopped', 'Task has been stopped.');
    };

    const handleGoBack = () => {
        router.back();
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

    const getProgressPercentage = () => {
        const maxTime = 28800; // 8 hours in seconds
        return Math.min((elapsedTime / maxTime) * 100, 100);
    };

    if (!selectedOrganization) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingSection}>
                    <Text style={styles.loadingText}>Loading...</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Current Organization Display */}
            <View style={[styles.orgCard, { borderLeftColor: selectedOrganization.color }]}>
                <View style={styles.orgCardContent}>
                    <Text style={styles.orgIcon}>{selectedOrganization.icon}</Text>
                    <View style={styles.orgDetails}>
                        <Text style={styles.orgName}>{selectedOrganization.name}</Text>
                        <Text style={styles.orgId}>ID: {selectedOrganization.id}</Text>
                        <Text style={styles.orgStatus}>Status: Active</Text>
                    </View>
                </View>
            </View>


            {/* Action Buttons */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    style={styles.taskManagementButton}
                    onPress={() => router.push('/screens/task-management')}
                >
                    <Text style={styles.taskManagementButtonText}>Task Management</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.changeButton}
                    onPress={handleChangeOrganization}
                >
                    <Text style={styles.changeButtonText}>Change Organization</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            </View>

            {/* Change Organization Modal */}
            <Modal
                visible={showChangeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowChangeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Organization</Text>
                        <Text style={styles.modalSubtitle}>Select new organization:</Text>

                        <View style={styles.modalOrganizationsList}>
                            {organizations.map((org) => (
                                <TouchableOpacity
                                    key={org.id}
                                    style={[
                                        styles.modalOrgCard,
                                        tempSelectedOrg?.id === org.id && styles.modalOrgCardSelected,
                                        { borderColor: org.color }
                                    ]}
                                    onPress={() => setTempSelectedOrg(org)}
                                >
                                    <Text style={styles.modalOrgIcon}>{org.icon}</Text>
                                    <Text style={[
                                        styles.modalOrgName,
                                        tempSelectedOrg?.id === org.id && styles.modalOrgNameSelected
                                    ]}>
                                        {org.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowChangeModal(false);
                                    setTempSelectedOrg(null);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalConfirmButton,
                                    !tempSelectedOrg && styles.modalConfirmButtonDisabled
                                ]}
                                onPress={handleConfirmChange}
                                disabled={!tempSelectedOrg}
                            >
                                <Text style={styles.modalButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
    },
    orgCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    orgCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orgIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    orgDetails: {
        flex: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 3,
    },
    orgId: {
        fontSize: 12,
        color: '#666',
        marginBottom: 3,
    },
    orgStatus: {
        fontSize: 12,
        color: '#34C759',
        fontWeight: '600',
    },
    taskSection: {
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
    taskSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    taskInputContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    taskInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        fontSize: 12,
        backgroundColor: '#f8f9fa',
    },
    startButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonDisabled: {
        backgroundColor: '#ccc',
    },
    startButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    stopButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    activeTaskCard: {
        backgroundColor: '#f0f8ff',
        padding: 10,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#34C759',
    },
    activeTaskTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    activeTaskName: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 2,
    },
    activeTaskOrg: {
        fontSize: 10,
        color: '#666',
        marginBottom: 10,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    timerCircle: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerSvg: {
        position: 'absolute',
    },
    timerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    timerLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    actionsSection: {
        gap: 10,
        marginBottom: 15,
    },
    taskManagementButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
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
    taskManagementButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    changeButton: {
        backgroundColor: '#FF9500',
        padding: 10,
        borderRadius: 6,
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
    changeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    backButton: {
        backgroundColor: '#8E8E93',
        padding: 10,
        borderRadius: 6,
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
        fontSize: 12,
    },
    loadingSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        width: '85%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 15,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalOrganizationsList: {
        gap: 8,
        marginBottom: 15,
    },
    modalOrgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modalOrgCardSelected: {
        backgroundColor: 'white',
        borderColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    modalOrgIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    modalOrgName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    modalOrgNameSelected: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#8E8E93',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    modalConfirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
