import { ClassData } from "../../../../../Redux/Admin/adminClasses";

export interface Grade {
    _id: string;
    studentId: string;
    courseId: string;
    score: number;
    subject: string;
    comments?: string;
    dateAwarded?: string;
    title?: string;
    gradeTitle?: string;
    name?: string
}

export interface StudentDetails {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isSuspended: boolean;
    phoneNumber?: string;
    grades?: Grade[];
}

export type ConfirmModalType = {
    type: "suspend" | "unsuspend" | "remove";
    id: string | null;
    userType: string;
};

export type AdminUser = UserDetails;

export interface Course {
    _id?: any;
    name?: string;
    email: string | null;
    phoneNumber: string | null;
    userType: "course";
    isSuspended: boolean;
    description?: string;
    title?: string
}


export interface Teacher {
    _id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    userType: "teacher";
    isSuspended: boolean;
    firstName?: string;
    lastName?: string;
}
export interface UserDetails {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    isDeleted?: boolean;
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    parentId?: string;
    teacherDetails?: [
        {
            _id: string;
            name: string;
            email: string | null;
            phoneNumber: string | null;
            userType: "teacher";
            isSuspended: boolean;
            firstName?: string;
            lastName?: string;
        }
    ]
    teachers?: [
        {
            _id: string;
            name: string;
            email: string | null;
            phoneNumber: string | null;
            userType: "teacher";
            isSuspended: boolean;
            firstName?: string;
            lastName?: string;
        }
    ]
    // courses?: Array<{
    //     _id: string;
    //     title: string;
    //     description?: string;
    //     isSuspended?: boolean;
    // }>;
    reports?: string[];
    password?: string;
    children?: StudentDetails[];
    parentDetails?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        isSuspended?: boolean;
    };
    students?: StudentDetails[];
    title?: string;
    description?: string;
    studentIds?: string[];
    classIds?: string[];
    grades?: Grade[];
    gradeId?: any;
    gradeTitle?: any;
    skills?: any;
    languages?: any;
    certifications?: any;
    schoolAttended?: any;
    teacher?: any;
    courses?: Course[];
    name?: any
}


export interface UserDetailsDuo {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    isDeleted?: boolean;
    isSuspended?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    parentId?: string;
    teacherDetails?: [
        {
            _id: string;
            name: string;
            email: string | null;
            phoneNumber: string | null;
            userType: "teacher";
            isSuspended: boolean;
            firstName?: string;
            lastName?: string;
        }
    ]
    teachers?: [
        {
            _id: string;
            name: string;
            email: string | null;
            phoneNumber: string | null;
            userType: "teacher";
            isSuspended: boolean;
            firstName?: string;
            lastName?: string;
        }
    ]
    // courses?: Array<{
    //     _id: string;
    //     title: string;
    //     description?: string;
    //     isSuspended?: boolean;
    // }>;
    reports?: string[];
    password?: string;
    children?: StudentDetails[];
    parentDetails?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        isSuspended?: boolean;
    };
    students?: StudentDetails[];
    title?: string;
    description?: string;
    studentIds?: string[];
    classIds?: string[];
    grades?: Grade[];
    gradeId?: any;
    gradeTitle?: any;
    skills?: any;
    languages?: any;
    certifications?: any;
    schoolAttended?: any;
    teacher?: any;
    courses?: Course[];
    name?: any
    ;
    classes: ClassData[]
}
