import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

// Identity & people
import session from "./features/session/session.slice";
import auth from "./features/auth/auth.slice";
import users from "./features/users/users.slice";
import accounts from "./features/accounts/accounts.slice";
import superAdmin from "./features/superAdmin/superAdmin.slice";
import wards from "./features/wards/wards.slice";
// Academic structure
import grades from "./features/grades/grades.slice";
import subjects from "./features/subjects/subjects.slice";
import groups from "./features/groups/groups.slice";
import resources from "./features/resources/resources.slice";
import awards from "./features/awards/awards.slice";
// Classes & classroom
import sessions from "./features/classes/sessions.slice";
import classes from "./features/classes/classes.slice";
import adminClasses from "./features/classes/legacyAdminClasses.slice";
import classroom from "./features/classroom/classroom.slice";
// Money
import pricing from "./features/pricing/pricing.slice";
import checkout from "./features/payments/checkout.slice";
import transactions from "./features/payments/transactions.slice";
import lessonFees from "./features/payments/lessonFees.slice";
import access from "./features/access/access.slice";
// Work, platform
import tasks from "./features/tasks/tasks.slice";
import announcements from "./features/announcements/announcements.slice";
import platform from "./features/platform/platformSettings.slice";
import awardGrants from "./features/awards/awardGrants.slice";
import notificationPrefs from "./features/notifications/preferences.slice";
import notifications from "./features/notifications/notifications.slice";
import settings from "./features/settings/settings.slice";

export const store = configureStore({
  reducer: {
    session, auth, users, accounts, superAdmin, wards,
    grades, subjects, groups, resources, awards,
    sessions, classes, adminClasses, classroom,
    pricing, checkout, transactions, lessonFees, access,
    tasks, announcements, platform, notifications, settings, awardGrants, notificationPrefs,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
