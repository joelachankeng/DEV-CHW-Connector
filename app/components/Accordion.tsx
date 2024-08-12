import { Collapse } from "@kunukn/react-collapse";
import { useState } from "react";

type iAccordionProps = {
  children: React.ReactNode;
  buttonInner?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  transition?: string;
  classnames?: {
    parent?: string;
    container?: string;
    button?: string;
  };
};

export default function Accordion({
  children,
  buttonInner,
  isOpen,
  onToggle,
  transition = "height 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  classnames,
}: iAccordionProps) {
  const [isCollapsed, setIsCollapsed] = useState(isOpen);
  const handleClick = () => {
    setIsCollapsed(!isCollapsed);
    onToggle && onToggle();
  };
  return (
    <div className={classnames?.parent || ""}>
      <button className={classnames?.button || ""} onClick={handleClick}>
        {buttonInner}
      </button>
      <Collapse
        isOpen={isCollapsed}
        transition={transition}
        className={classnames?.container || ""}
      >
        {children}
      </Collapse>
    </div>
  );
}
