// src/Components/ErrorDisplay/ErrorDisplay.tsx
import React from "react";
import "./ErrorDisplay.css";

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorMessage,
  onRetry,
}) => {
  let headerText = "Oops! Something Went Wrong.";
  let descriptionText = errorMessage;
  let emoji = "😟";

  if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("Network error")
  ) {
    emoji = "📡";
    headerText = "Network Connection Lost";
    descriptionText =
      "It looks like there's a problem connecting to our servers. Please check your internet connection and try again.";
  } else if (errorMessage.includes("server problem")) {
    emoji = "⚙️";
    headerText = "Server Error";
    descriptionText =
      "We're experiencing a temporary issue on our side. Please try again in a moment.";
  }

  return (
    <div className="error-display-container">
      <p className="error-emoji" style={{ fontSize: 64 }}>
        {emoji}
      </p>
      <h2 className="error-header">{headerText}</h2>
      <p className="error-description">{descriptionText}</p>
      <br />
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
