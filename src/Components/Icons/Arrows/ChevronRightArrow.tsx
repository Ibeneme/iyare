import React from "react";

interface ChevronRightArrowProps {
  width?: number; // Width of the SVG
  height?: number; // Height of the SVG
  color?: string; // Stroke color
}

const ChevronRightArrow: React.FC<ChevronRightArrowProps> = ({
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
          d="M6 17L11 12L6 7M13 17L18 12L13 7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default ChevronRightArrow;
