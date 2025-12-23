import { configureStore } from "@reduxjs/toolkit";
import adminAuth from "../Redux/Admin/Auth";
import adminParent from "./Admin/AdminParent";
import adminDepartment from "./Admin/AdminDepartment";
import adminCourse from "./Admin/adminCourse";
import adminUsers from "./Admin/adminUsers";
import AdminGrade from "./Admin/AdminGrade";
import adminClasses from "./Admin/adminClasses";
import SettingsSlice from "./Slices/SettingsSlice";
import awardSlice from "./Awards/awardSlice";
import subjectSlice from "./Slices/subject.slice";
import classSlice from "./Slices/class.slice";
import resourcesSlice from "./Slices/resources.slice";
import lessonFeeSlice from "./Slices/lessonFee.slice";

export const store = configureStore({
  reducer: {
    subject: subjectSlice,
    class: classSlice,
    resources: resourcesSlice,
    lessonFee: lessonFeeSlice,

    adminAuth,
    adminParent,
    adminDepartment,
    adminCourse,
    adminUsers,
    AdminGrade,
    adminClasses,
    SettingsSlice,
    awards: awardSlice,
  } as any, // <-- bypass TS4023
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
