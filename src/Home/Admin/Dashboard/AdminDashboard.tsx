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

// Types
export type UserType =
  | "admin"
  | "parent"
  | "student"
  | "teacher"
  | "course"
  | "department"
  | "notFound";

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
  | "subscribed";

interface AdminDashboardProps {
  userType: UserType;
  initialFilter?: FilterType;
}

const filterOptions: Record<UserType, FilterType[]> = {
  admin: ["all", "active", "disabled", "suspended"],
  parent: ["all", "active", "disabled", "reported"],
  student: [
    "all",
    "active",
    "disabled",
    "missed3Classes",
    "upcomingClass",
    "reported",
  ],
  teacher: ["all", "active", "disabled", "inClass", "upcomingReported"],
  course: ["all", "active", "subscribed"],
  department: ["all", "active", "suspended"],
  notFound: ["all"],
  //  null: ["all"],
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userType,
  initialFilter = "all",
}) => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>(initialFilter);
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

  const [newUser, setNewUser] = useState<any>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "male",
    specialization: "",
    parentId: "",
  });

  const departments = [
    { id: 1, name: "Mathematics", description: "Mathematics Department" },
    { id: 2, name: "Science", description: "Science Department" },
  ];

  const [parents] = useState([
    { id: 1, fullName: "John Doe" },
    { id: 2, fullName: "Jane Smith" },
  ]);

  // Sample data generator
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

  // Filter Logic
  const filterData = (data: any[]) => {
    if (filter === "all") return data;

    return data.filter((item) => {
      switch (filter) {
        case "active":
        case "disabled":
        case "suspended":
          return item.status === filter;
        case "subscribed":
        case "inClass":
        case "upcomingClass":
        case "reported":
        case "missed3Classes":
        case "upcomingReported":
          return item[filter] === true;
        default:
          return true;
      }
    });
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

  const handleViewDetails = (id: number) => {
    navigate(`/admin-details/${id}`);
  };

  const dataToDisplay = filterData(getSampleData());

  const getTitle = () =>
    userType
      ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard`
      : "Dashboard";

  // Function to format the filter text
  const formatFilterText = (text: string) => {
    let formatted = text.charAt(0).toUpperCase() + text.slice(1);

    formatted = formatted.replace(/([A-Z])/g, " $1");

    formatted = formatted.replace(/([0-9])/g, " $1 ");
    formatted = formatted.trim();

    return formatted;
  };

  return (
    <div className="admin-dashboard">
      <h2>{getTitle()}</h2>
      <p>View all {userType}s. Click the "Add" button to register a new one.</p>

      {/* TABS SECTION */}
      <div className="tabs-container">
        {userType &&
          filterOptions[userType] &&
          filterOptions[userType].map((f) => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {formatFilterText(f)}
            </button>
          ))}
      </div>

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
          {dataToDisplay.length === 0 ? (
            <tr>
              <td
                colSpan={
                  userType !== "course" && userType !== "department" ? 4 : 3
                }
              >
                No items available
              </td>
            </tr>
          ) : (
            dataToDisplay.map((user) => (
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
                  <button onClick={() => handleViewDetails(user.id)}>
                    <FaRegEye />
                  </button>
                </td>
              </tr>
            ))
          )}
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
            parents={parents}
            onAdd={() => console.log("Add user")}
            onCancel={() => setIsModalOpen(false)}
          />
        </ModalDropdown>
      )}
    </div>
  );
};

export default AdminDashboard;
