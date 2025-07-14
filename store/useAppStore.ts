import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Organization {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface TaskActivity {
    id: string;
    startTime: Date;
    endTime: Date | null;
    duration: number; // in seconds
}

export interface Task {
    id: string;
    name: string;
    organization: Organization;
    startTime: Date | null;
    elapsedTime: number;
    isTracking: boolean;
    activities: TaskActivity[];
}

interface AppState {
    // Organizations
    selectedOrganization: Organization | null;
    organizations: Organization[];
    
    // Tasks
    tasks: Task[];
    currentTask: Task | null;
    elapsedTime: number;
    
    // Actions
    setSelectedOrganization: (org: Organization) => void;
    addTask: (task: Task) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    startTracking: (taskId: string) => void;
    stopTracking: () => void;
    setElapsedTime: (time: number) => void;
    resetCurrentTask: () => void;
    addTaskActivity: (taskId: string, activity: TaskActivity) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            selectedOrganization: null,
            organizations: [
                { id: 'A', name: 'Organization A', icon: '🏢', color: '#007AFF' },
                { id: 'B', name: 'Organization B', icon: '🏛️', color: '#34C759' },
                { id: 'C', name: 'Organization C', icon: '🏭', color: '#FF9500' },
            ],
            tasks: [
                {
                    id: 'hardcoded-task-1',
                    name: 'Location Tracking Task',
                    organization: { id: 'A', name: 'Organization A', icon: '🏢', color: '#007AFF' },
                    startTime: null,
                    elapsedTime: 0,
                    isTracking: false,
                    activities: [],
                }
            ],
            currentTask: null,
            elapsedTime: 0,

            // Actions
            setSelectedOrganization: (org) => {
                set({ selectedOrganization: org });
            },

            addTask: (task) => {
                const taskWithActivities = { ...task, activities: [] };
                set((state) => ({
                    tasks: [...state.tasks, taskWithActivities]
                }));
            },

            updateTask: (taskId, updates) => {
                set((state) => ({
                    tasks: state.tasks.map(task => 
                        task.id === taskId ? { ...task, ...updates } : task
                    ),
                    currentTask: state.currentTask?.id === taskId 
                        ? { ...state.currentTask, ...updates }
                        : state.currentTask
                }));
            },

            deleteTask: (taskId) => {
                set((state) => ({
                    tasks: state.tasks.filter(task => task.id !== taskId),
                    currentTask: state.currentTask?.id === taskId ? null : state.currentTask
                }));
            },

            startTracking: (taskId) => {
                const state = get();
                const task = state.tasks.find(t => t.id === taskId);

                // If there is a currentTask in progress, save its session as an activity
                if (state.currentTask && state.currentTask.isTracking && state.currentTask.startTime) {
                    const endTime = new Date();
                    const duration = Math.floor((endTime.getTime() - state.currentTask.startTime.getTime()) / 1000);
                    const newActivity = {
                        id: Date.now().toString(),
                        startTime: state.currentTask.startTime,
                        endTime: endTime,
                        duration: duration,
                    };
                    // Save activity to the previous currentTask
                    set((prevState) => ({
                        tasks: prevState.tasks.map(t =>
                            t.id === state.currentTask!.id
                                ? { ...t, activities: [...(t.activities || []), newActivity] }
                                : t
                        ),
                        currentTask: {
                            ...state.currentTask!,
                            activities: [...(state.currentTask!.activities || []), newActivity],
                        },
                    }));
                }

                if (task) {
                    const startTime = new Date();
                    const updatedTask = {
                        ...task,
                        startTime: startTime,
                        isTracking: true,
                    };

                    set({
                        currentTask: updatedTask,
                        elapsedTime: 0,
                        tasks: state.tasks.map(t =>
                            t.id === taskId ? updatedTask : t
                        )
                    });
                }
            },

            stopTracking: () => {
                const state = get();
                if (state.currentTask && state.currentTask.isTracking && state.currentTask.startTime) {
                    const endTime = new Date();
                    const duration = Math.floor((endTime.getTime() - state.currentTask.startTime.getTime()) / 1000);
                    const newActivity = {
                        id: Date.now().toString(),
                        startTime: state.currentTask.startTime,
                        endTime: endTime,
                        duration: duration,
                    };

                    const updatedTask = {
                        ...state.currentTask,
                        startTime: null,
                        isTracking: false,
                        elapsedTime: state.currentTask.elapsedTime + state.elapsedTime,
                        activities: [...(state.currentTask.activities || []), newActivity],
                    };

                    set({
                        currentTask: updatedTask,
                        elapsedTime: 0,
                        tasks: state.tasks.map(t =>
                            t.id === updatedTask.id ? updatedTask : t
                        )
                    });
                }
            },

            setElapsedTime: (time) => {
                set({ elapsedTime: time });
            },

            resetCurrentTask: () => {
                set({ currentTask: null, elapsedTime: 0 });
            },

            addTaskActivity: (taskId, activity) => {
                set((state) => ({
                    tasks: state.tasks.map(task => 
                        task.id === taskId ? { ...task, activities: [...task.activities, activity] } : task
                    ),
                    currentTask: state.currentTask?.id === taskId ? { ...state.currentTask, activities: [...state.currentTask.activities, activity] } : state.currentTask
                }));
            },
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                selectedOrganization: state.selectedOrganization,
                tasks: state.tasks,
                currentTask: state.currentTask,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Fix dates in tasks
                    if (Array.isArray(state.tasks)) {
                        state.tasks = state.tasks.map(task => ({
                            ...task,
                            startTime: task.startTime ? new Date(task.startTime) : null,
                            activities: Array.isArray(task.activities)
                                ? task.activities.map(act => ({
                                    ...act,
                                    startTime: act.startTime ? new Date(act.startTime) : new Date(0),
                                    endTime: act.endTime ? new Date(act.endTime) : (act.endTime === null ? null : new Date(0)),
                                }))
                                : [],
                        }));
                        // Ensure hardcoded task is present
                        const hasHardcodedTask = state.tasks.some(task => task.id === 'hardcoded-task-1');
                        if (!hasHardcodedTask) {
                            state.tasks.push({
                                id: 'hardcoded-task-1',
                                name: 'Location Tracking Task',
                                organization: { id: 'A', name: 'Organization A', icon: '🏢', color: '#007AFF' },
                                startTime: null,
                                elapsedTime: 0,
                                isTracking: false,
                                activities: [],
                            });
                        }
                    }
                    // Fix dates in currentTask
                    if (state.currentTask) {
                        state.currentTask = {
                            ...state.currentTask,
                            startTime: state.currentTask.startTime ? new Date(state.currentTask.startTime) : null,
                            activities: Array.isArray(state.currentTask.activities)
                                ? state.currentTask.activities.map(act => ({
                                    ...act,
                                    startTime: act.startTime ? new Date(act.startTime) : new Date(0),
                                    endTime: act.endTime ? new Date(act.endTime) : (act.endTime === null ? null : new Date(0)),
                                }))
                                : [],
                        };
                    }
                }
            },
        }
    )
); 