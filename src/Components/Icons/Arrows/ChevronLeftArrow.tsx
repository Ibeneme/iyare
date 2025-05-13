import React from "react";

interface ChevronLeftArrowProps {
  width?: number; // Width of the SVG
  height?: number; // Height of the SVG
  color?: string; // Stroke color
}

const ChevronLeftArrow: React.FC<ChevronLeftArrowProps> = ({
  width = 24, // Default width
  height = 24, // Default height
  color = "#000000", // Default color
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M18 17L13 12L18 7M11 17L6 12L11 7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default ChevronLeftArrow;
