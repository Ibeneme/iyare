import React from "react";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const MinusIcon: React.FC<IconProps> = ({
  width = 32,
  height = 32,
  color = "#000000",
}) => {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
    >
      <path
        d="M540,1106 L528,1106 C527.447,1106 527,1105.55 527,1105 C527,1104.45 527.447,1104 528,1104 L540,1104 C540.553,1104 541,1104.45 541,1105 C541,1105.55 540.553,1106 540,1106 L540,1106 Z M534,1089 C525.163,1089 518,1096.16 518,1105 C518,1113.84 525.163,1121 534,1121 C542.837,1121 550,1113.84 550,1105 C550,1096.16 542.837,1089 534,1089 L534,1089 Z"
        fill={color}
      />
    </svg>
  );
};

export default MinusIcon;
