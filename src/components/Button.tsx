import "./Button.css";

type Props = {
  text: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function Button({
  text,
  onClick,
  className,
  type = "button",
  disabled,
}: Props) {
  return (
    <button
      className={`btn${className ? ` ${className}` : ""}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {text}
    </button>
  );
}
