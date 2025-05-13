import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";
import libraryImg from "../../assets/images/library.jpg";
import ScrollingCards from "./ScrollingCards";
import ModalDropdownSubjects from "../../Components/Modal/ModalDropdownSubjects";

const Hero: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="hero"
        style={{
          backgroundImage: `url(${libraryImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          width: "100vw",
          flexDirection: "column",
        }}
      >
        <div className="hero-content">
          <h1>
            We are the
            <span style={{ color: "#FFD000", paddingLeft: 8, paddingRight: 0 }}>
              future
            </span>{" "}
            of
            <span
              style={{ color: "#FFD000", paddingLeft: 8, paddingRight: 16 }}
            >
              Learning
            </span>
          </h1>

          <p className="hero-description">
            Iyare Learning Hub provides inclusive, community-driven education
            tailored to every learner's growth journey.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-btn enquire"
              onClick={() => setIsModalOpen(true)}
            >
              Enquire
            </button>
            <button
              className="hero-btn signin"
              onClick={() => navigate("/auth-sign-in")}
            >
              Sign In
            </button>
          </div>
        </div>

        <ScrollingCards />
      </div>

      {isModalOpen && (
        <ModalDropdownSubjects onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default Hero;
