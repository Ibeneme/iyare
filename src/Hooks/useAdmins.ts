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
import { UserType } from "../Pages/Admin/Admin/Dashboard/AdminDashboard";


export const useAdminActions = () => {
    const dispatch = useDispatch<AppDispatch>();

    const getAdmins = () => {
        return dispatch(fetchAllAdmins())
            .then((res) => {
                console.log("Fetched admins successfully:", res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error("Failed to fetch admins:", err);
                return { success: false, error: err.message || err };
            });
    };

    const getAdminById = (id: string, userType: string) => {
        return dispatch(fetchAdminById({ id, userType }))
            .then((res) => {
                console.log(`Fetched ${userType} by ID (${id}):`, res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error(`Failed to fetch ${userType} by ID (${id}):`, err);
                return { success: false, error: err.message || err };
            });
    };

    const suspendAdmin = (id: string, userType: UserType) => {
        return dispatch(toggleSuspendAdmin({ id, userType }))
            .then((res) => {
                console.log(`Suspended ${userType} ID (${id}):`, res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error(`Failed to suspend ${userType} ID (${id}):`, err);
                return { success: false, error: err.message || err };
            });
    };

    const removeAdmin = (id: string, userType: UserType) => {
        return dispatch(deleteAdmin({ id, userType }))
            .then((res) => {
                console.log(`Removed ${userType} ID (${id}):`, res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error(`Failed to remove ${userType} ID (${id}):`, err);
                return { success: false, error: err.message || err };
            });
    };

    const updateOwnProfile = (payload: {
        id: string;
        email?: string;
        password?: string;
        role?: string;
        token: string;
    }) => {
        return dispatch(updateSelfAdmin(payload))
            .then((res) => {
                console.log("Updated own profile:", res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error("Failed to update own profile:", err);
                return { success: false, error: err.message || err };
            });
    };

    const createAdmin = (payload: {
        email: string;
        password: string;
        role: string;
        token: string;
    }) => {
        return dispatch(addAdmin(payload as any))
            .then((res) => {
                console.log("Created admin:", res);
                return { success: true, data: res.payload };
            })
            .catch((err) => {
                console.error("Failed to create admin:", err);
                return { success: false, error: err.message || err };
            });
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