import { useState } from "react";

export default function SVGCloseButton({
  bgStroke = {
    default: "currentColor",
    hover: "currentColor",
  },
  stroke = {
    default: "currentColor",
    hover: "currentColor",
  },
  border = {
    default: "currentColor",
    hover: "currentColor",
  },
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24.001"
      height="23.999"
      viewBox="0 0 24.001 23.999"
      className="w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <g id="X_button" data-name="X button" transform="translate(1 1)">
        <g id="Rest">
          <path
            id="Circle"
            d="M4.222,19.778a11,11,0,1,0,0-15.556A11,11,0,0,0,4.222,19.778Z"
            transform="translate(-1 -1.001)"
            fill={isHovered ? bgStroke.hover : bgStroke.default}
            stroke={isHovered ? border.hover : border.default}
            strokeMiterlimit="10"
            strokeWidth="2"
          />
          <line
            id="Line"
            x1="7"
            y2="7"
            transform="translate(7.5 7.5)"
            fill="none"
            stroke={isHovered ? stroke.hover : stroke.default}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <line
            id="Line-2"
            data-name="Line"
            x1="7"
            y1="7"
            transform="translate(7.5 7.5)"
            fill="none"
            stroke={isHovered ? stroke.hover : stroke.default}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </g>
    </svg>
  );
}
