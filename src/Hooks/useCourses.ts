import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
//import { useToast } from "../Context/ToastProvider";

import {
    createCourse,
    fetchCourses,
    fetchCourseById,
    clearCourse,
} from "../Redux/Admin/adminCourse";

export const useCourseActions = () => {
    const dispatch = useDispatch<AppDispatch>();
   // const { addToast } = useToast();

    // Get all courses
    const getCourses = async () => {
        try {
            const res = await dispatch(fetchCourses());
            if (fetchCourses.rejected.match(res)) {
            //    throw new Error(res.payload || "Failed to fetch courses");
            }
            //addToast("success", "Courses fetched successfully");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || "Error fetching courses";
            console.error(message, err);
            //addToast("error", message);
            return { success: false, error: message };
        }
    };

    // Get course by ID
    const getCourseById = async (id: string) => {
        try {
            const res = await dispatch(fetchCourseById(id));
            if (fetchCourseById.rejected.match(res)) {
            //    throw new Error(res.payload || `Failed to fetch course ${id}`);
            }
            //addToast("success", "Course details loaded");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || `Error fetching course ${id}`;
            console.error(message, err);
            //addToast("error", message);
            return { success: false, error: message };
        }
    };

    // Create course
    const addCourse = async (courseData: any) => {
        try {
            const res = await dispatch(createCourse(courseData));
            if (createCourse.rejected.match(res)) {
                //addToast("error", res.payload || "Failed to create course");
                return { success: false, error: res.payload };
            }
            //addToast("success", "Course created successfully");
            return { success: true, data: res.payload };
        } catch (err: any) {
            const message = err.message || "Error creating course";
            console.error(message, err);
            //addToast("error", message);
            return { success: false, error: message };
        }
    };

    const resetSelectedCourse = () => {
        dispatch(clearCourse());
    };

    return {
        getCourses,
        getCourseById,
        addCourse,
        resetSelectedCourse,
    };
};