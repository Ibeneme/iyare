import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
//import { useToast } from "../Context/ToastProvider";
import {
    createUser,
    fetchAllUsersByType,
    fetchUserById,
    updateUser,
    clearUserState,
} from "../Redux/Admin/adminUsers";

export const useUserActions = () => {
    const dispatch = useDispatch<AppDispatch>();
    //const { addToast } = useToast();

    const addUser = async (userData: any) => {
        try {
            const res = await dispatch(createUser(userData));
            if (createUser.rejected.match(res)) {
                // Ensure payload is a string. If it's an object, stringify it or access a specific message property.
                // const errorMessage =
                //     typeof res.payload === "string"
                //         ? res.payload
                //         : (res.payload as any)?.message ||
                //         (res.error?.message as string) ||
                //         "Failed to create user";
                //    addToast("error", errorMessage);
                return { success: false, error: res.payload };
            }
            // Assuming res.payload contains the actual data on success
            //    addToast("success", "User created successfully");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || "Failed to create user";
            console.error(message, err);
            //    addToast("error", message);
            return { success: false, error: message };
        }
    };

    const getAllUsersByType = async (userType: string) => {
        try {
            const res = await dispatch(fetchAllUsersByType(userType as any));
            if (fetchAllUsersByType.rejected.match(res)) {
                // const errorMessage =
                //     typeof res.payload === "string"
                //         ? res.payload
                //         : (res.payload as any)?.message ||
                //         (res.error?.message as string) ||
                //         "Failed to fetch users";
                //    addToast("error", errorMessage);
                return { success: false, error: res.payload };
            }
            // Assuming res.payload.users contains the actual user array on success
            //    addToast("success", `Users (${userType}) fetched successfully`);
            return { success: true, data: (res.payload as any)?.users }; // Cast payload to any to access .users
        } catch (err: any) {
            const message = err.message || "Failed to fetch users";
            console.error(message, err);
            //    addToast("error", message);
            return { success: false, error: message };
        }
    };

    const getUserById = async (userType: string, id: string) => {
        try {
            const res = await dispatch(fetchUserById({ userType, id } as any));
            if (fetchUserById.rejected.match(res)) {
                // const errorMessage =
                //     typeof res.payload === "string"
                //         ? res.payload
                //         : (res.payload as any)?.message ||
                //         (res.error?.message as string) ||
                //         "Failed to fetch user";
                //    addToast("error", errorMessage);
                return { success: false, error: res.payload };
            }
            //    addToast("success", "User fetched successfully");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || "Failed to fetch user";
            console.error(message, err);
            //    addToast("error", message);
            return { success: false, error: message };
        }
    };

    const editUser = async (userType: any, id: string, updateData: any) => {
        try {
            const res = await dispatch(updateUser({ userType, id, updateData } as any));
            console.log(userType, id, updateData)
            if (updateUser.rejected.match(res)) {
                // const errorMessage =
                //     typeof res.payload === "string"
                //         ? res.payload
                //         : (res.payload as any)?.message ||
                //         (res.error?.message as string) ||
                        "Failed to update user";
                //    addToast("error", errorMessage);
                return { success: false, error: res.payload };
            }
            //    addToast("success", "User updated successfully");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || "Failed to update user";
            console.error(message, err);
            //    addToast("error", message);
            return { success: false, error: message };
        }
    };

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