import React from "react";
import "./SubjectsPage.css";


import booka from "../../assets/images/subjects/booka.jpg";
import bookb from "../../assets/images/subjects/bookb.jpg";
import bookc from "../../assets/images/subjects/bookc.jpg";
import booke from "../../assets/images/subjects/booke.jpg";
import codeb from "../../assets/images/subjects/codeb.jpg";

const subjects = {
  Core: {
    items: ["Maths", "English"],
    image: booka,
    description:
      "These core subjects form the foundation of your academic journey, emphasizing fundamental skills.",
  },
  "Non-verbal Reasoning": {
    items: ["Non-verbal reasoning"],
    image: bookb,
    description:
      "Enhances problem-solving and logical thinking through visual reasoning.",
  },
  Languages: {
    items: ["French", "Ibo", "Yoruba"],
    image: bookc,
    description:
      "Explore new languages and cultures, enhancing communication skills.",
  },
  Science: {
    items: ["Physics", "Biology", "Chemistry"],
    image: booke,
    description:
      "Dive into the natural world and understand how things work at a scientific level.",
  },
  Technology: {
    items: ["UI/UX", "Front End Web Development"],
    image: codeb,
    description:
      "Learn the basics of creating engaging web interfaces and user experiences.",
  },
};

const SubjectsPage: React.FC = () => {
  return (
    <div className="subjects-wrapper">
      <div className="subjects-container">
        <h1 className="subjects-title">Subjects</h1>
        <div className="subjects-grid">
          {Object.entries(subjects).map(([category, data]) => (
            <div key={category} className="subject-card">
              <img src={data.image} alt={category} className="subject-image" />
              <div >
                <h2 className="category-title">{category}</h2>
                <p className="subject-description">{data.description}</p>
                <ul className="subject-list">
                  {data.items.map((subject) => (
                    <li key={subject} className="subject-item">
                      {subject}
                    </li>
                  ))}
                </ul>{" "}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
