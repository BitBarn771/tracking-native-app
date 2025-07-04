import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function OrganizationSelectionScreen() {
    const { organizations, setSelectedOrganization } = useAppStore();

    const handleOrganizationSelect = (organization: any) => {
        setSelectedOrganization(organization);
        Alert.alert(
            'Organization Selected',
            `${organization.name} has been selected.`,
            [
                {
                    text: 'OK',
                    onPress: () => router.push('/screens/organization-details')
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Organization</Text>
                <Text style={styles.subtitle}>Choose your organization to continue</Text>
            </View>

            <View style={styles.organizationsList}>
                {organizations.map((org) => (
                    <TouchableOpacity
                        key={org.id}
                        style={[styles.orgCard, { borderLeftColor: org.color }]}
                        onPress={() => handleOrganizationSelect(org)}
                    >
                        <Text style={styles.orgIcon}>{org.icon}</Text>
                        <View style={styles.orgDetails}>
                            <Text style={styles.orgName}>{org.name}</Text>
                            <Text style={styles.orgId}>ID: {org.id}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
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
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    organizationsList: {
        gap: 15,
    },
    orgCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        flexDirection: 'row',
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
    orgIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    orgDetails: {
        flex: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    orgId: {
        fontSize: 12,
        color: '#666',
    },
}); 