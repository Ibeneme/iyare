import React, { useState } from "react";
import "./ModalDropdownSubjects.css";
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

const ModalDropdownSubjects: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSubject(""); // reset subject when category changes
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(""); // Clear error on typing
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEnquire = () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!selectedCategory || !selectedSubject) {
      alert("Please select a category and subject.");
      return;
    }

    alert(
      `Enquiry submitted for ${selectedCategory} - ${selectedSubject} with email: ${email}`
    );
    onClose();
  };

  const categoryKeys = Object.keys(subjects);
  const selectedData = selectedCategory ? subjects[selectedCategory as keyof typeof subjects] : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Enquire</h2>

        <div>
          <input
            type="email"
            className="email-input"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            style={{ padding: `16px 12px` }}
          />
          {emailError && <p className="error-text">{emailError}</p>}
        </div>

        {/* Category select */}
        <select
          className="subject-select"
          style={{ padding: `12px 12px` }}
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categoryKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        {/* Subject select */}
        {selectedCategory && (
          <select
            className="subject-select"
            style={{ padding: `12px 12px`, marginTop: "12px" }}
            value={selectedSubject}
            onChange={handleSubjectChange}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {selectedData?.items.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        )}

        {/* Description */}
        {selectedData && (
          <div className="subject-details">
            <p className="subject-description">{selectedData.description}</p>
          </div>
        )}

        <button className="cta-btn" onClick={handleEnquire}>
          Enquire
        </button>
      </div>
    </div>
  );
};

export default ModalDropdownSubjects;