import React, { useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Organization {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
}

interface OrganizationSelectorProps {
    visible: boolean;
    onClose: () => void;
    onOrganizationSelect: (organization: Organization, taskName: string) => void;
}

export default function OrganizationSelector({ visible, onClose, onOrganizationSelect }: OrganizationSelectorProps) {
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [taskName, setTaskName] = useState('');
    const [scaleAnimation] = useState(new Animated.Value(0));
    const [fadeAnimation] = useState(new Animated.Value(0));

    const organizations: Organization[] = [
        {
            id: 'work',
            name: 'Work',
            icon: '💼',
            color: '#007AFF',
            description: 'Professional tasks and work-related activities'
        },
        {
            id: 'personal',
            name: 'Personal',
            icon: '🏠',
            color: '#34C759',
            description: 'Personal errands and home activities'
        },
        {
            id: 'travel',
            name: 'Travel',
            icon: '✈️',
            color: '#FF9500',
            description: 'Travel and transportation tracking'
        },
        {
            id: 'fitness',
            name: 'Fitness',
            icon: '💪',
            color: '#FF3B30',
            description: 'Workout and fitness activities'
        },
        {
            id: 'shopping',
            name: 'Shopping',
            icon: '🛒',
            color: '#AF52DE',
            description: 'Shopping and retail activities'
        },
        {
            id: 'healthcare',
            name: 'Healthcare',
            icon: '🏥',
            color: '#FF2D92',
            description: 'Medical appointments and health activities'
        },
        {
            id: 'education',
            name: 'Education',
            icon: '📚',
            color: '#5856D6',
            description: 'Learning and educational activities'
        },
        {
            id: 'entertainment',
            name: 'Entertainment',
            icon: '🎬',
            color: '#FF6B35',
            description: 'Entertainment and leisure activities'
        },
        {
            id: 'other',
            name: 'Other',
            icon: '📌',
            color: '#8E8E93',
            description: 'Miscellaneous activities'
        },
    ];

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(fadeAnimation, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnimation.setValue(0);
            fadeAnimation.setValue(0);
        }
    }, [visible]);

    const handleOrganizationSelect = (org: Organization) => {
        setSelectedOrg(org);
    };

    const handleStartTracking = () => {
        if (selectedOrg && taskName.trim()) {
            onOrganizationSelect(selectedOrg, taskName.trim());
            onClose();
            setSelectedOrg(null);
            setTaskName('');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={onClose}
        >
            <Animated.View
                style={[
                    styles.overlay,
                    { opacity: fadeAnimation }
                ]}
            >
                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ scale: scaleAnimation }] }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🏢 Choose Organization</Text>
                        <Text style={styles.subtitle}>Select organization type and task name to save</Text>
                    </View>

                    {/* Organization Grid */}
                    <View style={styles.orgGrid}>
                        {organizations.map((org) => (
                            <TouchableOpacity
                                key={org.id}
                                style={[
                                    styles.orgCard,
                                    selectedOrg?.id === org.id && styles.orgCardSelected,
                                    { borderColor: org.color }
                                ]}
                                onPress={() => handleOrganizationSelect(org)}
                            >
                                <View style={[styles.orgIconContainer, { backgroundColor: org.color + '20' }]}>
                                    <Text style={styles.orgIcon}>{org.icon}</Text>
                                </View>
                                <Text style={styles.orgName}>{org.name}</Text>
                                <Text style={styles.orgDescription}>{org.description}</Text>
                                {selectedOrg?.id === org.id && (
                                    <View style={[styles.checkmark, { backgroundColor: org.color }]}>
                                        <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Task Input */}
                    {selectedOrg && (
                        <Animated.View
                            style={[
                                styles.taskInputContainer,
                                { opacity: fadeAnimation }
                            ]}
                        >
                            <Text style={styles.inputLabel}>Task Name:</Text>
                            <TextInput
                                style={styles.taskInput}
                                value={taskName}
                                onChangeText={setTaskName}
                                placeholder="Enter task name..."
                                placeholderTextColor="#999"
                                autoFocus
                            />
                        </Animated.View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.startButton,
                                (!selectedOrg || !taskName.trim()) && styles.buttonDisabled
                            ]}
                            onPress={handleStartTracking}
                            disabled={!selectedOrg || !taskName.trim()}
                        >
                            <Text style={styles.buttonText}>Save Organization</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 30,
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
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    orgGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 25,
    },
    orgCard: {
        width: (Dimensions.get('window').width * 0.9 - 60 - 15) / 2,
        padding: 20,
        borderRadius: 15,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        position: 'relative',
    },
    orgCardSelected: {
        backgroundColor: 'white',
        borderColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    orgIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    orgIcon: {
        fontSize: 28,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 6,
        textAlign: 'center',
    },
    orgDescription: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 16,
    },
    checkmark: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    taskInputContainer: {
        marginBottom: 25,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    taskInput: {
        padding: 15,
        borderWidth: 2,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    button: {
        flex: 1,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#8E8E93',
    },
    startButton: {
        backgroundColor: '#007AFF',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
}); 