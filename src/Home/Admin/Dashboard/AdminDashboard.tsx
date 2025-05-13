import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegEye,
  FaUserPlus,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import "./AdminDashboard.css";
import ModalDropdown from "../../../Components/Modal/ModalDropdown";
import AddUserModalContent from "./AddUserModalContent";

export type UserType =
  | "admin"
  | "parent"
  | "student"
  | "teacher"
  | "course"
  | "department"
  | "notFound"
  | null;

export type FilterType =
  | "all"
  | "active"
  | "disabled"
  | "suspended"
  | "inClass"
  | "upcomingClass"
  | "reported"
  | "missed3Classes"
  | "upcomingReported"
  | "subscribed"; // for course

interface AdminDashboardProps {
  userType: UserType;
  filter?: FilterType;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userType,
  filter = "all",
}) => {
  const [admins, setAdmins] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "disabled",
    },
    {
      id: 3,
      name: "Michael Johnson",
      email: "michael@example.com",
      status: "active",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  console.log(filter, "filter");

  const departments = [
    { id: 1, name: "Mathematics", description: "Mathematics Department" },
    { id: 2, name: "Science", description: "Science Department" },
    // Add other departments as needed
  ];

  const [newUser, setNewUser] = useState<any>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "male",
    specialization: "",
    parentId: "", // for student
  });

  // const [parents, setParents] = useState<any[]>([
  //   { id: 1, fullName: "John Doe" },
  //   { id: 2, fullName: "Jane Smith" },
  // ]);

  const [parents] = useState<any[]>([
    { id: 1, fullName: "John Doe" },
    { id: 2, fullName: "Jane Smith" },
  ]);

  // const handleAddUser = () => {
  //   // Handle adding user logic here
  //   console.log(newUser);
  // };
  const filterData = (data: any[]) => {
    if (filter === "all") return data;

    return data.filter((user) => {
      if (["active", "disabled", "suspended"].includes(filter))
        return user.status === filter;
      if (filter === "subscribed") return user.subscribed === true;
      if (filter === "inClass") return user.inClass === true;
      if (filter === "upcomingClass") return user.upcomingClass === true;
      if (filter === "reported") return user.reported === true;
      if (filter === "missed3Classes") return user.missed3Classes === true;
      if (filter === "upcomingReported") return user.upcomingReported === true;
      return true;
    });
  };

  const getSampleData = () => {
    switch (userType) {
      case "parent":
        return [
          {
            id: 1,
            name: "Alice Parent",
            email: "alice@school.com",
            status: "active",
          },
          {
            id: 2,
            name: "Bob Parent",
            email: "bob@school.com",
            status: "disabled",
          },
        ];
      case "student":
        return [
          {
            id: 1,
            name: "Charlie Student",
            email: "charlie@school.com",
            status: "active",
            missed3Classes: true,
          },
          {
            id: 2,
            name: "David Student",
            email: "david@school.com",
            status: "disabled",
            upcomingReported: true,
          },
        ];
      case "teacher":
        return [
          {
            id: 1,
            name: "Eve Teacher",
            email: "eve@school.com",
            status: "active",
            reported: true,
          },
          {
            id: 2,
            name: "Frank Teacher",
            email: "frank@school.com",
            status: "disabled",
            inClass: true,
          },
        ];
      case "course":
        return [
          {
            id: 1,
            name: "Mathematics",
            email: "N/A",
            status: "active",
            subscribed: true,
          },
          { id: 2, name: "English", email: "N/A", status: "suspended" },
          {
            id: 3,
            name: "Non-verbal reasoning",
            email: "N/A",
            status: "active",
          },
        ];
      case "department":
        return [
          { id: 1, name: "Science - Physics", email: "N/A", status: "active" },
          {
            id: 2,
            name: "Language - French",
            email: "N/A",
            status: "suspended",
          },
          { id: 3, name: "Maths", email: "N/A", status: "active" },
        ];
      default:
        return admins;
    }
  };

  const handleRemoveAdmin = (id: number) => {
    setAdmins(admins.filter((admin) => admin.id !== id));
  };

  const handleToggleStatus = (id: number) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              status: admin.status === "active" ? "disabled" : "active",
            }
          : admin
      )
    );
  };

  const handleViewAdminDetails = (id: number) => {
    navigate(`/admin-details/${id}`);
  };

  const displayData = filterData(getSampleData());

  return (
    <div className="admin-dashboard">
      <h2>
        {(userType ?? "").charAt(0).toUpperCase() + (userType ?? "").slice(1)}{" "}
        Dashboard
      </h2>
      <p>
        Here you can view all the {userType}s. Click on the "Add" button to add
        new entries to the list.
      </p>

      {filter === "all" && (
        <button className="add-admin-btn" onClick={() => setIsModalOpen(true)}>
          <FaUserPlus /> Add{" "}
          {userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : ""}
        </button>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            {userType !== "course" && userType !== "department" && (
              <th>Email</th>
            )}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              {userType !== "course" && userType !== "department" && (
                <td>{user.email}</td>
              )}
              <td>{user.status}</td>
              <td>
                {userType === "admin" && (
                  <>
                    <button onClick={() => handleToggleStatus(user.id)}>
                      {user.status === "active" ? (
                        <FaToggleOn />
                      ) : (
                        <FaToggleOff />
                      )}
                    </button>
                    <button onClick={() => handleRemoveAdmin(user.id)}>
                      <FaTrashAlt />
                    </button>
                  </>
                )}
                <button onClick={() => handleViewAdminDetails(user.id)}>
                  <FaRegEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <ModalDropdown onClose={() => setIsModalOpen(false)}>
          <AddUserModalContent
            userType={userType}
            filter={filter}
            newUser={newUser}
            setNewUser={setNewUser}
            departments={departments}
            parents={parents} // Pass list of parents for the student
            onAdd={() => console.log("oo")}
            onCancel={() => setIsModalOpen(false)}
          />
        </ModalDropdown>
      )}
    </div>
  );
};

export default AdminDashboard;
