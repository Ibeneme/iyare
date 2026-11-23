// src/hooks/useUsers.ts
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/index";
import {
    createUser,
    fetchAllUsersByType,
    fetchUserById,
    updateUser,
    clearUserState,
    type CreateUserPayload,
} from "../store/features/users/users.slice";

// Inline User type inside the hook
export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Generic result type for all actions
interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Payload for creating or editing user
export interface UserPayload {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string;
    role?: string;
    userType?: "teacher" | "student" | "parent" | "admin";
    [key: string]: any;
}

const splitName = (fullName?: string) => {
    const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
    };
};

const toCreateUserPayload = (userData: UserPayload): CreateUserPayload => {
    const parsed = splitName(userData.name);
    const firstName = userData.firstName ?? parsed.firstName;
    const lastName = userData.lastName ?? parsed.lastName;
    const resolvedType = (userData.userType ?? userData.role ?? "student") as CreateUserPayload["userType"];

    return {
        ...userData,
        userType: resolvedType,
        firstName,
        lastName,
        email: userData.email,
    };
};

export const useUserActions = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Add new user
    const addUser = async (userData: UserPayload): Promise<ActionResult<User>> => {
        try {
            const payload = toCreateUserPayload(userData);
            const res = await dispatch(createUser(payload)).unwrap();
            return { success: true, data: res as unknown as User };
        } catch (err: any) {
            return { success: false, error: err?.message || "Failed to create user" };
        }
    };

    // Fetch all users by type
    const getAllUsersByType = async (userType: string): Promise<ActionResult<User[]>> => {
        try {
            const res = await dispatch(fetchAllUsersByType(userType as any)).unwrap();
            const users = (res.users as unknown) as User[];
            return { success: true, data: users };
        } catch (err: any) {
            return { success: false, error: err?.message || `Failed to fetch users of type ${userType}` };
        }
    };

    // Fetch user by ID
    const getUserById = async (userType: string, id: string): Promise<ActionResult<User>> => {
        try {
            const res = await dispatch(fetchUserById({ userType, id } as any)).unwrap();
            return { success: true, data: res as unknown as User };
        } catch (err: any) {
            return { success: false, error: err?.message || `Failed to fetch user ${id}` };
        }
    };

    // Edit/update user
    const editUser = async (userType: string, id: string, updateData: Partial<UserPayload>): Promise<ActionResult<User>> => {
        try {
            const parsed = updateData.name ? splitName(updateData.name) : null;
            const normalizedUpdate = {
                ...updateData,
                ...(parsed && updateData.firstName === undefined ? { firstName: parsed.firstName } : {}),
                ...(parsed && updateData.lastName === undefined ? { lastName: parsed.lastName } : {}),
            };
            const res = await dispatch(updateUser({ userType, id, updateData: normalizedUpdate } as any)).unwrap();
            return { success: true, data: res as unknown as User };
        } catch (err: any) {
            return { success: false, error: err?.message || `Failed to update user ${id}` };
        }
    };

    // Reset user state in Redux
    const resetUserState = () => {
        dispatch(clearUserState());
    };

    return {
        addUser,
        getAllUsersByType,
        getUserById,
        editUser,
        resetUserState,
    };
};