import React from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css"; 

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="not-found">
      <div className="not-found-container">
        <h1>404</h1>
        <h2>Oops! Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <button className="back-home-btn" onClick={goHome}>
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;