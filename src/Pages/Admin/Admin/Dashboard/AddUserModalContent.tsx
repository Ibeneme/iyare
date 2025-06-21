import React, { useState } from "react";

type AddUserModalContentProps = {
  userType: string | null;
  filter: string | undefined;
  newUser: any;
  setNewUser: React.Dispatch<React.SetStateAction<any>>;
  parents: any[];
  departments: any[];
  onAdd: () => void;
  onCancel: () => void;
};

const AddUserModalContent: React.FC<AddUserModalContentProps> = ({
  userType,
  filter,
  newUser,
  setNewUser,
  parents,
  departments,
  onAdd,
  onCancel,
}) => {
  const capitalizedType = userType
    ? userType.charAt(0).toUpperCase() + userType.slice(1)
    : "";

  console.log(departments, userType, "departmentss");
  // New state for department name and description
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });

  // Handle new department form input changes
  const handleDepartmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "name" | "description"
  ) => {
    setNewDepartment({ ...newDepartment, [field]: e.target.value });
  };

  return (
    <>
      <h2>Add New {capitalizedType}</h2>

      {/* Teacher Form */}
      {userType === "teacher" && filter === "all" && (
        <>
          <label>
            Full Name:
            <input
              type="text"
              placeholder="Enter full name"
              value={newUser.fullName}
              onChange={(e) =>
                setNewUser({ ...newUser, fullName: e.target.value })
              }
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              placeholder="Enter email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
          </label>
          <label>
            Phone Number:
            <input
              type="text"
              placeholder="Enter phone number"
              value={newUser.phoneNumber}
              onChange={(e) =>
                setNewUser({ ...newUser, phoneNumber: e.target.value })
              }
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              placeholder="Enter address"
              value={newUser.address}
              onChange={(e) =>
                setNewUser({ ...newUser, address: e.target.value })
              }
            />
          </label>
          <label>
            Gender:
            <select
              value={newUser.gender}
              onChange={(e) =>
                setNewUser({ ...newUser, gender: e.target.value })
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Specialization:
            <input
              type="text"
              placeholder="Enter specialization"
              value={newUser.specialization}
              onChange={(e) =>
                setNewUser({ ...newUser, specialization: e.target.value })
              }
            />
          </label>
        </>
      )}

      {/* Parent Form */}
      {userType === "parent" && filter === "all" && (
        <>
          <label>
            Full Name:
            <input
              type="text"
              placeholder="Enter full name"
              value={newUser.fullName}
              onChange={(e) =>
                setNewUser({ ...newUser, fullName: e.target.value })
              }
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              placeholder="Enter email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
          </label>
          <label>
            Phone Number:
            <input
              type="text"
              placeholder="Enter phone number"
              value={newUser.phoneNumber}
              onChange={(e) =>
                setNewUser({ ...newUser, phoneNumber: e.target.value })
              }
            />
          </label>
        </>
      )}

      {/* Student Form */}
      {userType === "student" && filter === "all" && (
        <>
          <label>
            Full Name:
            <input
              type="text"
              placeholder="Enter full name"
              value={newUser.fullName}
              onChange={(e) =>
                setNewUser({ ...newUser, fullName: e.target.value })
              }
            />
          </label>
          <div>
            <label>Parent:</label>
            <select
              value={newUser.parentId}
              onChange={(e) =>
                setNewUser({ ...newUser, parentId: e.target.value })
              }
            >
              <option value="">Select Parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.fullName}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Department Form */}
      {userType === "department" && (
        <>
          {/* <h3>Add New Department</h3> */}

          <label>
            Department Name:
            <input
              type="text"
              placeholder="Enter department name"
              value={newDepartment.name}
              onChange={(e) => handleDepartmentChange(e, "name")}
            />
          </label>

          <label>
            Department Description:
            <textarea
              placeholder="Enter department description"
              value={newDepartment.description}
              onChange={(e) => handleDepartmentChange(e as any, "description")}
            />
          </label>

          {/* <button
            onClick={() => {
              // Add department logic here (e.g., send it to backend)
              console.log("Adding new department:", newDepartment);
              // Reset fields after adding the department
              setNewDepartment({ name: "", description: "" });
            }}
            style={{
              backgroundColor: "var(--dark-green)",
              color: "var(--white)",
            }}
          >
            Add Department
          </button> */}
        </>
      )}

      <br />
      <button
        onClick={onAdd}
        style={{ backgroundColor: "var(--dark-green)", color: "var(--white)" }}
      >
        Add {capitalizedType}
      </button>

      <button onClick={onCancel}>Cancel</button>
    </>
  );
};

export default AddUserModalContent;
