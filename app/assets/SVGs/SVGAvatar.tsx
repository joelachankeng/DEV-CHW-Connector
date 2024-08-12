export default function SVGAvatar({
  bgFill = "#e8e0d6",
  graphicFill = "#032525",
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="h-full w-full"
    >
      <g
        id="User_image"
        data-name="User image"
        transform="translate(-627 -299)"
      >
        <circle
          id="User_image-2"
          data-name="User image"
          cx="20"
          cy="20"
          r="20"
          transform="translate(627 299)"
          fill={bgFill}
        />
        <g id="Icon" transform="translate(636 306.156)">
          <path
            id="Graphic"
            d="M14.815,6.238a3.9,3.9,0,1,0-3.9,3.9,3.9,3.9,0,0,0,3.9-3.9m-10.136,0a6.238,6.238,0,1,1,6.238,6.238A6.238,6.238,0,0,1,4.678,6.238M2.4,22.612H19.43a6.352,6.352,0,0,0-6.287-5.458H8.689A6.352,6.352,0,0,0,2.4,22.612M0,23.5a8.687,8.687,0,0,1,8.689-8.689h4.454A8.687,8.687,0,0,1,21.832,23.5a1.448,1.448,0,0,1-1.447,1.447H1.447A1.448,1.448,0,0,1,0,23.5"
            transform="translate(0 -0.041)"
            fill={graphicFill}
          />
        </g>
      </g>
    </svg>
  );
}
