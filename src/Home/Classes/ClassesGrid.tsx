import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClassesGrid.css";

type ClassData = {
  id: number;
  subject: string;
  department: string;
  teacher: string;
  image: string;
  status: "ongoing" | "upcoming" | "finished" | "canceled";
};

const classes: ClassData[] = [
  {
    id: 1,
    subject: "Maths",
    department: "Mathematics",
    teacher: "Mr. John Doe",
    image: "maths-image-url.jpg",
    status: "ongoing",
  },
  {
    id: 2,
    subject: "English",
    department: "Language Arts",
    teacher: "Mrs. Jane Smith",
    image: "english-image-url.jpg",
    status: "upcoming",
  },
  {
    id: 3,
    subject: "Non-verbal reasoning",
    department: "Reasoning",
    teacher: "Dr. Emma Brown",
    image: "non-verbal-reasoning-image-url.jpg",
    status: "finished",
  },
  {
    id: 4,
    subject: "French",
    department: "Languages",
    teacher: "Ms. Claire Dupont",
    image: "french-image-url.jpg",
    status: "canceled",
  },
  {
    id: 5,
    subject: "Ibo",
    department: "Languages",
    teacher: "Mr. Chijioke Obi",
    image: "ibo-image-url.jpg",
    status: "ongoing",
  },
  {
    id: 6,
    subject: "Yoruba",
    department: "Languages",
    teacher: "Mrs. Bolanle Ayodele",
    image: "yoruba-image-url.jpg",
    status: "upcoming",
  },
  {
    id: 7,
    subject: "Physics",
    department: "Science",
    teacher: "Prof. Mark Thomas",
    image: "physics-image-url.jpg",
    status: "ongoing",
  },
  {
    id: 8,
    subject: "Biology",
    department: "Science",
    teacher: "Dr. Sarah Wilson",
    image: "biology-image-url.jpg",
    status: "finished",
  },
  {
    id: 9,
    subject: "Chemistry",
    department: "Science",
    teacher: "Dr. Alice Johnson",
    image: "chemistry-image-url.jpg",
    status: "canceled",
  },
];

const ClassesGrid: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");

  const navigateToClassDetails = (id: number) => {
    navigate(`/class-details/${id}`);
  };

  const getRandomBgColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  const filteredClasses =
    activeTab === "all"
      ? classes
      : classes.filter((classData) => classData.status === activeTab);

  const tabs = ["all", "ongoing", "upcoming", "finished", "canceled"];

  return (
    <div style={{ marginTop: 72 }}>
      <h1 className="classes-title">All Classes</h1>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Classes */}
      {filteredClasses.length > 0 ? (
        <div className="classes-grid">
          {filteredClasses.map((classData) => (
            <div key={classData.id} className="class-item">
              <div
                className="class-image-placeholder"
                style={{ backgroundColor: getRandomBgColor() }}
              >
                <h3>{classData.subject}</h3>
              </div>
              <div className="class-info">
                <p>{classData.department}</p>
                <p>{`Teacher: ${classData.teacher}`}</p>
                <p className="class-date">09:54am Sunday 12th June 3035</p>
                <button onClick={() => navigateToClassDetails(classData.id)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "left", padding: "16px 0", color: "#999" }}>
          No items found.
        </p>
      )}
    </div>
  );
};

export default ClassesGrid;