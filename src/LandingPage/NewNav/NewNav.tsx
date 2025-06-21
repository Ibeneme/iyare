import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./NewNav.css";
import logo from "../../assets/images/logo.jpg";
import ModalDropdownSubjects from "../../Components/Modal/ModalDropdownSubjects";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleNavbar = (): void => {
    setIsOpen(!isOpen);
  };

  const closeNavbar = (): void => {
    setIsOpen(false);
  };

  const navigate = useNavigate();
  return (
    <>
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")}>
          <img
            src={logo}
            style={{
              width: 36,
              height: 36,
              objectFit: "cover",
              objectPosition: "center",
              transform: "scale(2.1)",
            }}
          />
        </div>

        <div className={`nav-links ${isOpen ? "active-nav" : ""}`}>
          <NavLink to="/" className="nav-link" onClick={closeNavbar}>
            Home
          </NavLink>
          <NavLink to="/Subjects" className="nav-link" onClick={closeNavbar}>
            Subjects
          </NavLink>
          <NavLink to="/terms" className="nav-link" onClick={closeNavbar}>
            Terms and Conditions
          </NavLink>
          <NavLink to="/policy" className="nav-link" onClick={closeNavbar}>
            Privacy Policy
          </NavLink>
          <NavLink
            to="/admin-sign-in"
            className="nav-link"
            onClick={closeNavbar}
          >
            Admin
          </NavLink>

          <button
            className="en-btn"
            style={{
              backgroundColor: "var(--yellow)",
            }}
            onClick={() => navigate("/auth-sign-in")}
          >
            Sign in
          </button>

          <button
            className="donate-btn"
            onClick={() => {
              closeNavbar();
              setIsModalOpen(true);
            }}
          >
            Enroll Now
          </button>
        </div>

        <div className="menu-icon" onClick={toggleNavbar}>
          {isOpen ? "✕" : "☰"}
        </div>
      </nav>

      {isOpen && <div className="backdrop" onClick={closeNavbar}></div>}
  
      {isModalOpen && (
        <ModalDropdownSubjects onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
