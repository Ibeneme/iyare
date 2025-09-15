// import { useDispatch } from "react-redux";

// import { AppDispatch } from "../Redux/store";

// import {
//     fetchDepartments,
//     fetchDepartmentById,
//     createDepartment,
//     updateDepartment,
//     deleteDepartment,
// } from "../Redux/Admin/adminDepartment";


// export const useDepartmentActions = () => {
//     const dispatch = useDispatch<AppDispatch>();


//     const getDepartments = async () => {
//         try {
//             const res = await dispatch(fetchDepartments());
//             console.error(res, "Departments fetched successfully");
//             //       addToast("success", "Departments fetched successfully");
//             return { success: true, data: res.payload };
//         } catch (err: any) {
//             const message = err.message || "Failed to fetch departments";
//             console.error(message, err);
//             //       addToast("error", message);
//             return { success: false, error: message };
//         }
//     };

//     const getDepartmentById = async (id: string) => {
//         try {
//             const res = await dispatch(fetchDepartmentById(id as any));
//             //       addToast("success", "Department details fetched");
//             return { success: true, data: res.payload };
//         } catch (err: any) {
//             const message = err.message || `Failed to fetch department with ID: ${id}`;
//             console.error(message, err);
//             //       addToast("error", message);
//             return { success: false, error: message };
//         }
//     };

//     const addDepartment = async (name: string) => {
//         try {
//             const res = await dispatch(createDepartment({ name }));
//             if (createDepartment.rejected.match(res)) {
//                 //       addToast("error", res.payload as any); return { success: false, error: res.payload };
//             }
//             //       addToast("success", "Department created successfully");
//             return { success: true, data: res.payload };
//         } catch (err: any) {
//             const message = err.message || "Failed to create department";
//             console.error(message, err);
//             //       addToast("error", message);
//             return { success: false, error: message };
//         }
//     };

//     const editDepartment = async (
//         id: string,
//         name: string,
//         courseIds?: string[]
//     ) => {
//         try {
//             const res = await dispatch(updateDepartment({ id, name, courseIds } as any));
//             if (updateDepartment.rejected.match(res)) {
//                 //       addToast("error", res.payload as any); return { success: false, error: res.payload };
//             }
//             //       addToast("success", "Department updated successfully");
//             return { success: true, data: res.payload };
//         } catch (err: any) {
//             const message = err.message || "Failed to update department";
//             console.error(message, err);
//             //       addToast("error", message);
//             return { success: false, error: message };
//         }
//     };

//     const removeDepartment = async (id: string) => {
//         try {
//             const res = await dispatch(deleteDepartment(id as any));
//             if (deleteDepartment.rejected.match(res)) {
//                 //       addToast("error", res.payload as any);
//                 return { success: false, error: res.payload };
//             }
//             //       addToast("success", "Department deleted successfully");
//             return { success: true, data: res.payload };
//         } catch (err: any) {
//             const message = err.message || "Failed to delete department";
//             console.error(message, err);
//             //       addToast("error", message);
//             return { success: false, error: message };
//         }
//     };

//     return {
//         getDepartments,
//         getDepartmentById,
//         addDepartment,
//         editDepartment,
//         removeDepartment,
//     };
// };