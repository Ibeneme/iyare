import React from "react";

interface BurgerIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const BurgerIcon: React.FC<BurgerIconProps> = ({
  width = 24,
  height = 24,
  color = "#000000",
}) => {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      width={width}
      height={height}
    >
      <path
        fill={color}
        fillRule="evenodd"
        d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z"
      />
    </svg>
  );
};

export default BurgerIcon;
