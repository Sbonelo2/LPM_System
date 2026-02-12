import "./Button.css";

type Props = {
  text?: string; // Make text optional for icon buttons
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost"; // Add variant prop
  children?: React.ReactNode; // Allow children for more flexible content (e.g., icons)
};

export default function Button({
  text,
  onClick,
  className,
  type = "button",
  disabled,
  variant = "primary", // Default variant
  children,
}: Props) {
  const buttonClassName = `btn btn--${variant}${className ? ` ${className}` : ""}`;

  return (
    <button
      className={buttonClassName}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children || text}
    </button>
  );
}
