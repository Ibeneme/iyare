// src/hooks/useCourses.ts
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import {
    createCourse,
    fetchCourses,
    fetchCourseById,
    clearCourse,
} from "../Redux/Admin/adminCourse";

// Inline types to avoid TS4023
export interface CourseData {
    _id: string;
    title: string;
    description?: string;
    instructor?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const useCourseActions = () => {
    const dispatch = useDispatch<AppDispatch>();

    const getCourses = async (): Promise<ActionResult<CourseData[]>> => {
        try {
            const res = await dispatch(fetchCourses()).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || "Error fetching courses" };
        }
    };

    const getCourseById = async (id: string): Promise<ActionResult<CourseData>> => {
        try {
            const res = await dispatch(fetchCourseById(id)).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || `Error fetching course ${id}` };
        }
    };

    const addCourseAction = async (courseData: {
        title: string;
        description?: string;
        instructor?: string;
    }): Promise<ActionResult<CourseData>> => {
        try {
            const res = await dispatch(createCourse(courseData)).unwrap();
            return { success: true, data: res };
        } catch (err: any) {
            return { success: false, error: err.message || "Error creating course" };
        }
    };

    const resetSelectedCourse = () => {
        dispatch(clearCourse());
    };

    return {
        getCourses,
        getCourseById,
        addCourse: addCourseAction,
        resetSelectedCourse,
    };
};