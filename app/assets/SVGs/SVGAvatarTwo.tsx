export function SVGAvatarTwo({
  bgColor = "#e8e0d6",
  strokeColor = "#686867",
}: {
  bgColor?: string;
  strokeColor?: string;
}) {
  return (
    <svg
      id="User"
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="60"
      viewBox="0 0 60 60"
      className="w-full h-full"
    >
      <g id="User_icon" data-name="User icon" transform="translate(-1844 -14)">
        <circle
          id="CIrcle"
          cx="30"
          cy="30"
          r="30"
          transform="translate(1844 14)"
          fill={bgColor}
        />
        <g
          id="Icon_-_Profile_rest"
          data-name="Icon - Profile rest"
          transform="translate(1874 44)"
        >
          <path
            id="Path_3750"
            data-name="Path 3750"
            d="M21,0A21,21,0,1,0,42,21,21.024,21.024,0,0,0,21,0Zm0,39.376A18.315,18.315,0,0,1,7.973,33.944a13.111,13.111,0,0,1,26.054,0A18.316,18.316,0,0,1,21,39.376ZM15.094,13.782A5.906,5.906,0,1,1,21,19.689,5.913,5.913,0,0,1,15.094,13.782ZM36.2,31.313a15.867,15.867,0,0,0-10.06-10.737,8.531,8.531,0,1,0-10.3-.016A15.613,15.613,0,0,0,5.8,31.317,18.371,18.371,0,1,1,39.375,21,18.268,18.268,0,0,1,36.2,31.314Z"
            transform="translate(-21 -21)"
            fill={strokeColor}
          />
        </g>
      </g>
    </svg>
  );
}
