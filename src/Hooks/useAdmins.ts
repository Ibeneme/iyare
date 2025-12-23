// src/hooks/useAdminActions.ts
import { useDispatch } from "react-redux";
import {
    fetchAllAdmins,
    fetchAdminById,
    toggleSuspendAdmin,
    deleteAdmin,
    updateSelfAdmin,
    addAdmin,
} from "../Redux/Admin/Auth";
import { AppDispatch } from "../Redux/store";

// Inline UserType
export type UserType = "admin" | "superAdmin" | "moderator";

// Admin type (you can expand this according to your API)
export interface AdminType {
    _id: string;
    email: string;
    role: string;
    token?: string;
    isSuspended?: boolean;
    firstName?: string;
    lastName?: string;
}

// Generic result type
interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Payloads
interface UpdateProfilePayload {
    id: string;
    email?: string;
    password?: string;
    role?: string;
    token: string;
}

interface CreateAdminPayload {
    email: string;
    password: string;
    role: string;
    firstName: string; // required
    lastName: string;  // required
    token?: string;
}

export const useAdminActions = () => {
    const dispatch = useDispatch<AppDispatch>();

    const getAdmins = async (): Promise<ActionResult<AdminType[]>> => {
        try {
            const res = await dispatch(fetchAllAdmins()).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    const getAdminById = async (id: string, userType: UserType): Promise<ActionResult<AdminType>> => {
        try {
            const res = await dispatch(fetchAdminById({ id, userType })).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    const suspendAdmin = async (
        id: string,
        userType: UserType
    ): Promise<ActionResult<{ id: string; message: string }>> => {
        try {
            const res = await dispatch(toggleSuspendAdmin({ id, userType })).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    const removeAdmin = async (
        id: string,
        userType: UserType
    ): Promise<ActionResult<{ id: string; message: string }>> => {
        try {
            const res = await dispatch(deleteAdmin({ id, userType })).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    const updateOwnProfile = async (payload: UpdateProfilePayload): Promise<ActionResult<AdminType>> => {
        try {
            const res = await dispatch(updateSelfAdmin(payload)).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    const createAdmin = async (payload: CreateAdminPayload): Promise<ActionResult<AdminType>> => {
        try {
            const res = await dispatch(addAdmin(payload)).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    };

    return {
        getAdmins,
        getAdminById,
        suspendAdmin,
        removeAdmin,
        updateOwnProfile,
        createAdmin,
    };
};