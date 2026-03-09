import "./Button.css";

type Props = {
  text?: string; // Make text optional for icon buttons
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline"; // Add variant prop
  children?: React.ReactNode; // Allow children for more flexible content (e.g., icons)
  style?: React.CSSProperties; // Add style prop
  size?: "small" | "medium" | "large";
};

export default function Button({
  text,
  onClick,
  className,
  type = "button",
  disabled,
  variant = "primary", // Default variant
  children,
  style,
  size = "medium",
}: Props) {
  const buttonClassName = `btn btn--${variant} btn--${size}${className ? ` ${className}` : ""}`;

  return (
    <button
      className={buttonClassName}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
    >
      {children || text}
    </button>
  );
}
