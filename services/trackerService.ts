interface TrackerCreateRequest {
    startDate: string;
    endDate: string;
    id: number;
}

interface TrackerCreateResponse {
    success: boolean;
    message?: string;
    data?: any;
}

class TrackerService {
    private baseUrl: string;

    constructor() {
        // Get base URL from environment variable
        this.baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    }

    async createTracker(startDate: Date, endDate: Date): Promise<TrackerCreateResponse> {
        try {
            const requestData: TrackerCreateRequest = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                id: 1, // Hardcoded ID as requested
            };

            const response = await fetch(`${this.baseUrl}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('Error creating tracker:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // Helper method to create tracker with current time as start
    async startTracking(): Promise<TrackerCreateResponse> {
        const startDate = new Date();
        const endDate = new Date(); // Will be updated when tracking stops
        return this.createTracker(startDate, endDate);
    }

    // Helper method to create tracker with specific time range
    async createTrackerWithRange(startDate: Date, endDate: Date): Promise<TrackerCreateResponse> {
        return this.createTracker(startDate, endDate);
    }
}

export default new TrackerService(); 