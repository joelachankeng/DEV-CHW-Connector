import SVGAvatar from "~/assets/SVGs/SVGAvatar";

export default function Avatar({
  src,
  alt,
  className = "h-full w-full text[#e8e0d6] rounded-full overflow-hidden border border-transparent hover:border-[3px] hover:border-chw-light-purple transition duration-300 ease-in-out",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <>
      <div className={className}>
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <SVGAvatar />
        )}
      </div>
    </>
  );
}
