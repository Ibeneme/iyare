import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchUserById } from "../../../../Redux/Admin/adminUsers";
import { getGrades } from "../../../../Redux/Admin/AdminGrade";
import { useAdminActions } from "../../../../Hooks/useAdmins";
import { useUserActions } from "../../../../Hooks/useUsers";

import Loader from "../../../../Components/Loader/Loader";
import { useToast } from "../../../../Context/ToastProvider";
import {
  Grade,
  AdminUser,
  UserDetailsDuo,
} from "./UserDetailsTypes/userDetailsTypes";
import "./UserDetails.css";
import {
  getUserDetailsButtonVisibility,
  getDisplayEntries,
} from "./UserDetailsConstants/UserDetailsConstants";
import {
  UserDetailsEntries,
  CoursesInDepartment,
  //ParentDetailsCard,
  ChildrenList,
  StudentsInGrade,
  StudentGradesList,
} from "./UserDetailsComponent/UserDetailsCards/UserDetailsCards";
import {
  ConfirmationModal,
  EditGradeModal,
  EditStudentGradeModal,
} from "./UserDetailsComponent/UserDetailsModals/UserDetailsModal";
import UserActionButtons from "./UserDetailsComponent/UserDetailsButton/UserDetailsButton";
import { EditGeneralUserModal } from "./UserDetailsComponent/UserDetailsModals/EditGeneralUserModal";
import ClassCardList from "../../Classes/ClassCardList";

const UserDetails: React.FC = () => {
  const { id, userType } = useParams<{ id: string; userType: string }>();

  const {
    showSuspendButton,
    showRemoveButton,
    showSendMailButton,
    showEditGeneralButton,
    showEditStudentGradesButton,
    showEditGeneralButtonNew,
  } = getUserDetailsButtonVisibility(userType || "");

  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { suspendAdmin, removeAdmin } = useAdminActions();
  const { editUser } = useUserActions();
  const [isEditGeneralUserModalOpen, setIsEditGeneralUserModalOpen] =
    useState(false);
  const [userData, setUserData] = useState<UserDetailsDuo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "remove" | "unsuspend";
    id: string | null;
    userType: any;
  } | null>(null);

  const [isEditGradeModalOpen, setIsEditGradeModalOpen] = useState(false);
  const [editGradeData, setEditGradeData] = useState({
    title: "",
    description: "",
  });

  const [isEditStudentGradeModalOpen, setIsEditStudentGradeModalOpen] =
    useState(false);
  // const [editStudentGradeFormData, setEditStudentGradeFormData] = useState<
  //   Partial<Grade>
  // >({ score: 0, subject: "", comments: "" });
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<any>("");
  const [allGrades, setAllGrades] = useState<Grade[]>([]);

  const getUserById = async () => {
    setLoading(true);
    setError(null);
    try {
      const action = await dispatch(fetchUserById({ id, userType } as any));
      if (action.payload) {
        setUserData(action.payload);
        if (
          ["grade", "department", "course"].includes(
            userType?.toLowerCase() as string
          )
        ) {
          setEditGradeData({
            title: action.payload.title || "",
            description: action.payload.description || "",
          });
        }
        //setSelectedSkills(action.payload.skills || []);
        // setSelectedLanguages(action.payload.languages || []);
      } else {
        setError("User not found or failed to load data.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGrades = async () => {
    setLoading(true);
    try {
      const action = await dispatch(getGrades());
      if (action.payload) {
        setAllGrades(action.payload as Grade[]);
      } else {
        // addToast("error", "Failed to fetch all grades.");
      }
    } catch (error) {
      console.error("Error fetching all grades:", error);
      //addToast("error", "An error occurred while fetching all grades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !userType) return;
    const fetchData = async () => {
      await getUserById();
      if (userType.toLowerCase() === "student") {
        await fetchAllGrades();
      }
    };
    fetchData();
  }, [id, userType, dispatch]);

  const handleToggleStatusClick = (user: AdminUser) => {
    const actionType = user.isSuspended ? "unsuspend" : "suspend";
    setConfirmModal({ type: actionType, id: user._id, userType });
  };

  const handleRemoveAdminClick = (user: AdminUser) => {
    setConfirmModal({ type: "remove", id: user._id, userType });
  };

  if (error) return <p className="loading-error-text error-text">{error}</p>;

  const displayEntries = getDisplayEntries(userData);

  const handleConfirmAction = () => {
    if (!confirmModal?.id) return;

    const { id, type, userType: modalUserType } = confirmModal;
    setLoading(true);

    let action: Promise<any>;

    switch (type) {
      case "suspend":
      case "unsuspend":
        action = suspendAdmin(id, modalUserType as any);
        break;
      case "remove":
        action = removeAdmin(id, modalUserType as any);
        break;
      default:
        throw new Error(`Unsupported action type: ${type}`);
    }

    action
      .then((res: any) => {
        if (res.success) {
          addToast("success", res.data?.message || `${type} successful`);
          if (type === "remove") {
            navigate(-1);
          } else {
            getUserById();
          }
        } else {
          addToast("error", res.error || `${type} failed`);
        }
      })
      .catch((err) => {
        console.error(err);
        addToast("error", "Something went wrong!");
      })
      .finally(() => {
        setLoading(false);
        setConfirmModal(null);
      });
  };

  const navigateToStudentDetails = (studentId: string) => {
    navigate(`/user-details/student/${studentId}`);
  };

  const handleOpenEditGradeModal = () => {
    if (
      userData &&
      ["grade", "department", "course"].includes(userType?.toLowerCase() as any)
    ) {
      setEditGradeData({
        title: userData.title || "",
        description: userData.description || "",
      });
      setIsEditGradeModalOpen(true);
    }
  };

  const handleEditGradeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditGradeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveGradeChanges = async () => {
    setLoading(true);
    try {
      if (!id || !userType) {
        addToast("error", "Missing ID or User Type for update.");
        setLoading(false);
        return;
      }
      const response = await editUser(userType, id, editGradeData);
      if (response.success) {
        addToast("success", `${userType} updated successfully!`);
        setIsEditGradeModalOpen(false);
        getUserById();
      } else {
        addToast("error", response.error || `Failed to update ${userType}`);
      }
    } catch (error) {
      console.error("Error saving general entity changes:", error);
      addToast("error", "An unexpected error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditGradeModal = () => {
    setIsEditGradeModalOpen(false);
  };

  const handleOpenEditStudentGradeModal = (gradeToEdit?: Grade) => {
    if ((userType?.toLowerCase() as any) === "student" && userData?._id) {
      setIsEditStudentGradeModalOpen(true);
    }
    console.log(gradeToEdit);
  };

  const handleOpenEditGeneralUserModal = (gradeToEdit?: Grade) => {
    // if ((userType?.toLowerCase() as any) === "student" && userData?._id) {
    //   setIsEditStudentGradeModalOpen(true);
    // }
    console.log(gradeToEdit);
    setIsEditGeneralUserModalOpen(true);
  };

  const handleSaveStudentGradeChanges = async () => {
    setLoading(true);
    try {
      if (!selectedStudentGrade || !userData?._id) {
        addToast(
          "error",
          "Missing selected grade or student ID for update. Please select a grade."
        );
        setLoading(false);
        return;
      }

      const updatedData = {
        gradeId: selectedStudentGrade?._id,
      };
      const response = await editUser("student", userData._id, updatedData);
      if (response.success) {
        addToast("success", "Student's class grade updated successfully!");
        setIsEditStudentGradeModalOpen(false);
        await getUserById();
      } else {
        addToast(
          "error",
          response.error || "Failed to update student's class grade."
        );
      }
    } catch (error: any) {
      console.error("Error saving student's class grade changes:", error);
      addToast(
        "error",
        error.message ||
          "An unexpected error occurred during student's class grade save."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditStudentGradeModal = () => {
    setIsEditStudentGradeModalOpen(false);
    setSelectedStudentGrade(null);
    // setEditStudentGradeFormData({});
  };

  const navigateToClassDetails = (id: string) => {
    navigate(`/class-details/${id}`);
  };

  const handleSaveGeneralChanges = async (
    formData: Partial<UserDetailsDuo>
  ) => {
    setLoading(true);
    try {
      if (!userData?._id) return;
      const response = await editUser(userType, userData._id, formData);
      if (response.success) {
        addToast("success", `${userType} updated successfully`);
        setIsEditGeneralUserModalOpen(false);
        await getUserById();
      } else {
        addToast("error", response.error || "Update failed");
      }
    } catch (err) {
      addToast("error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  console.log(userData, "userData");
  return (
    <div className="page-wrapper-new">
      <div
      //className="user-details-container"
      >
        {loading ? (
          <Loader />
        ) : (
          <>
            <UserDetailsEntries
              userType={userType}
              entries={displayEntries}
              lastName={userData?.lastName || ""}
              firstName={userData?.firstName || ""}
              name={userData?.name || ""}
              title={userData?.title || ""}
              email={userData?.email || ""}
              teacherDetails={userData?.teacherDetails || []}
            >
              <UserActionButtons
                userType={userType || ""}
                userData={userData}
                showRemoveButton={showRemoveButton}
                showSuspendButton={showSuspendButton}
                showSendMailButton={showSendMailButton}
                showEditGeneralButton={showEditGeneralButton}
                showEditStudentGradesButton={showEditStudentGradesButton}
                showEditGeneralButtonNew={showEditGeneralButtonNew}
                handleRemoveAdminClick={handleRemoveAdminClick}
                handleToggleStatusClick={handleToggleStatusClick}
                handleOpenEditGradeModal={handleOpenEditGradeModal}
                handleOpenEditStudentGradeModal={
                  handleOpenEditStudentGradeModal
                }
                handleOpenEditGeneralUserModal={handleOpenEditGeneralUserModal}
              />
            </UserDetailsEntries>

            {userType === "course" && (
              <div>
                <br />
                <ClassCardList
                  classes={userData?.classes || ""}
                  loading={loading}
                  error={error}
                  // allClassesCount={userData?.classes.length}
                  navigateToClassDetails={navigateToClassDetails}
                />
              </div>
            )}

            {userType?.toLowerCase() === "department" ||
              (userType?.toLowerCase() === "student" &&
                Array.isArray(userData?.courses) && (
                  <CoursesInDepartment
                    userType={userType}
                    courses={userData?.courses}
                    onViewDetails={(courseId: any) =>
                      navigate(`/user-details/course/${courseId}`)
                    }
                  />
                ))}

            {/* {userType?.toLowerCase() === "student" &&
              userData?.parentDetails && (
                <ParentDetailsCard
                  userType={userType}
                  parent={userData.parentDetails}
                  onNavigate={(id: string) =>
                    navigate(`/user-details/parent/${id}`)
                  }
                />
              )} */}

            {userType?.toLowerCase() === "parent" &&
              Array.isArray(userData?.children) &&
              userData.children.length > 0 && (
                <ChildrenList
                  userType={userType}
                  children={userData.children}
                  onNavigate={(id: string) => navigateToStudentDetails(id)}
                />
              )}

            {userType?.toLowerCase() === "grade" &&
              Array.isArray(userData?.students) &&
              userData.students.length > 0 && (
                <StudentsInGrade
                  userType={userType}
                  students={userData.students}
                  onNavigate={(id: string) => navigateToStudentDetails(id)}
                />
              )}

            {userType?.toLowerCase() === "student" &&
              Array.isArray(userData?.grades) &&
              userData.grades.length > 0 && (
                <StudentGradesList
                  grades={userData.grades}
                  showEdit={showEditStudentGradesButton}
                  onEditGrade={(grade: any) =>
                    handleOpenEditStudentGradeModal(grade)
                  }
                />
              )}
          </>
        )}
      </div>
      {confirmModal && (
        <ConfirmationModal
          confirmModal={confirmModal}
          userType={userType || ""}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {isEditGeneralUserModalOpen && userData && (
        <EditGeneralUserModal
          userType={userType || ""}
          userData={userData}
          onClose={() => setIsEditGeneralUserModalOpen(false)}
          onSave={handleSaveGeneralChanges}
        />
      )}

      {isEditGradeModalOpen && (
        <EditGradeModal
          userType={userType || ""}
          data={editGradeData}
          onChange={handleEditGradeFormChange}
          onClose={handleCloseEditGradeModal}
          onSave={handleSaveGradeChanges}
        />
      )}
      {isEditStudentGradeModalOpen && (
        <EditStudentGradeModal
          user={userData || ""}
          allGrades={allGrades}
          selectedGrade={selectedStudentGrade}
          onSelect={setSelectedStudentGrade}
          onClose={handleCloseEditStudentGradeModal}
          onSave={handleSaveStudentGradeChanges}
        />
      )}
    </div>
  );
};

export default UserDetails;
