import { configureStore } from "@reduxjs/toolkit";
import adminAuth from "../Redux/Admin/Auth";
import adminParent from "./Admin/AdminParent";
import adminDepartment from "./Admin/adminDepartment";
import adminCourse from "./Admin/adminCourse";
import adminUsers from "./Admin/adminUsers";
import AdminGrade from "./Admin/AdminGrade";
import adminClasses from "./Admin/adminClasses";

export const store = configureStore({
  reducer: {
    adminAuth: adminAuth,
    adminParent: adminParent,
    adminDepartment: adminDepartment,
    adminCourse: adminCourse,
    adminUsers: adminUsers,
    AdminGrade: AdminGrade,
    adminClasses: adminClasses,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
