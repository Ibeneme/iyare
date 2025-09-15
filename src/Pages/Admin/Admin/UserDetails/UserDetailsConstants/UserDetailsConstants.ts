import { formatKey, formatDisplayValue } from "../UserDetailsUtils/userDetailsUtilsIndex"; // Adjust import paths accordingly

export const hiddenKeys = new Set<string>([
    "_id",
    "__v",
    "updatedAt",
    "password",
    "parentId",
    "courseIds",
    "teacherIds",
    "departmentId",
    "courses",
    "children",
    "parentDetails",
    "students",
    "studentIds",
    "classIds",
    "grades",
    "gradeId"
]);

export const dummySkills: string[] = [
    "Math", "Science", "Coding", "Art", "Music",
];

export const dummyLanguages: string[] = [
    "English", "French", "Spanish", "Arabic", "Mandarin",
];

export const displayKeyOverrides: Record<string, string> = {
    isSuspended: "Status",
    createdAt: "Created At",
    parentId: "Parent ID",
    reports: "Reports",
    courses: "Courses",
    role: "Role",
    title: "Title",
    description: "Description",
};



export const getDisplayEntries = (userData: Record<string, any> | null | undefined): [string, string][] => {
    if (!userData) return [];

    return Object.entries(userData)
        .filter(([key]) => !hiddenKeys.has(key))
        .map(([key, value]) => {
            const displayKey = displayKeyOverrides[key] || formatKey(key);
            const displayValue = formatDisplayValue(key, value);
            return [displayKey, displayValue];
        });
};



export function getUserDetailsButtonVisibility(userType: string) {
    const showSuspendButton =
        userType === "admin" ||
        userType === "teacher" ||
        userType === "student" ||
        userType === "parent";

    const showRemoveButton =
        userType === "admin" ||
        userType === "teacher" ||
        userType === "student" ||
        userType === "parent" ||
        userType === "grade" ||
        userType === "department" ||
        userType === "course";

    const showSendMailButton =
        userType === "admin" ||
        userType === "teacher" ||
        userType === "student" ||
        userType === "parent";

    const showEditGeneralButton =
        userType === "grade" ||
        userType === "department" ||
        userType === "course";


    const showEditGeneralButtonNew =
        userType === "admin" ||
        userType === "teacher" ||
        userType === "student" ||
        userType === "parent" ||
        userType === "grade" ||
        userType === "department" ||
        userType === "course";


    const showEditStudentGradesButton = userType === "student";

    return {
        showSuspendButton,
        showRemoveButton,
        showSendMailButton,
        showEditGeneralButton,
        showEditStudentGradesButton,
        showEditGeneralButtonNew
    };
}

