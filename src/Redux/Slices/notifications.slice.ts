import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance';

export interface NotificationModel {
    _id: string;
    title: string;
    description: string;
    recipient: string;
    recipientModel: 'Teacher' | 'Student' | 'Parent' | 'Admin';
    sender?: string;
    senderModel?: string | null;
    type?: string;
    relatedId?: string | null;
    isRead: boolean;
    meta?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

interface NotificationState {
    notifications: NotificationModel[];
    unreadCount: number;
    totalCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    totalCount: 0,
    loading: false,
    error: null,
};

// --- LOGGING HELPER ---
const log = (type: 'REQ' | 'RES' | 'ERR', action: string, data?: any) => {
    const now = new Date().toLocaleString('en-NG', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    });
    const prefix = `[${now}] [NG] NOTIFICATION SLICE`;
    const color = type === 'REQ' ? '\x1b[36m' : type === 'RES' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`\x1b[35m${prefix}\x1b[0m ${color}[${type}] ${action}${reset}`, data || '');
};

// --- ASYNC THUNKS ---

/**
 * Fetch notifications for the logged-in user.
 */
export const fetchNotifications = createAsyncThunk<
    { data: NotificationModel[]; totalCount: number; unreadCount: number },
    { unreadOnly?: boolean; limit?: number; page?: number } | void,
    { rejectValue: string }
>(
    'notification/fetchNotifications',
    async (params, { rejectWithValue }) => {
        log('REQ', 'Fetching user notifications', params);
        try {
            const queryParams = new URLSearchParams();
            if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.page) queryParams.append('page', params.page.toString());

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const response = await axiosInstance.get(`/api/notifications${queryString}`);

            log('RES', 'Fetched notifications', { count: response.data.data.length });
            return {
                data: response.data.data as NotificationModel[],
                totalCount: response.data.totalCount,
                unreadCount: response.data.unreadCount,
            };
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Network error';
            log('ERR', 'Failed to fetch notifications', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Mark a specific notification as read.
 */
export const markNotificationAsRead = createAsyncThunk<
    NotificationModel,
    string, // notification ID
    { rejectValue: string }
>(
    'notification/markAsRead',
    async (id: string, { rejectWithValue }) => {
        log('REQ', `Marking notification as read ID: ${id}`);
        try {
            const response = await axiosInstance.put(`/api/notifications/${id}/read`);
            log('RES', 'Notification marked as read', { id });
            return response.data.data as NotificationModel;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update notification';
            log('ERR', 'Mark as read failed', { id, error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

/**
 * Mark all user notifications as read.
 */
export const markAllNotificationsAsRead = createAsyncThunk<
    void,
    void,
    { rejectValue: string }
>(
    'notification/markAllAsRead',
    async (_, { rejectWithValue }) => {
        log('REQ', 'Marking all notifications as read');
        try {
            await axiosInstance.put(`/api/notifications/read-all`);
            log('RES', 'All notifications marked as read');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update all notifications';
            log('ERR', 'Mark all as read failed', { error: msg, status: err.response?.status });
            return rejectWithValue(msg);
        }
    }
);

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        clearNotificationError: (state) => {
            state.error = null;
        },
        // Optional client-side handler if you want to push real-time updates (e.g. WebSockets)
        addIncomingNotification: (state, action: PayloadAction<NotificationModel>) => {
            state.notifications.unshift(action.payload);
            state.totalCount += 1;
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
    },
    extraReducers: (builder) => {
        // --- fetchNotifications ---
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data;
                state.totalCount = action.payload.totalCount;
                state.unreadCount = action.payload.unreadCount;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // --- markNotificationAsRead ---
        builder
            .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<NotificationModel>) => {
                const index = state.notifications.findIndex((n) => n._id === action.payload._id);
                if (index !== -1) {
                    // If it was previously unread and is now read, decrease unread count securely
                    if (!state.notifications[index].isRead && action.payload.isRead) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                    state.notifications[index] = action.payload;
                }
            });

        // --- markAllNotificationsAsRead ---
        builder
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach((n) => {
                    n.isRead = true;
                });
                state.unreadCount = 0;
            });
    },
});

export const { clearNotificationError, addIncomingNotification } = notificationSlice.actions;
export default notificationSlice.reducer;