import { Link } from "react-router-dom";
import "./PillButton.css";

type Badge = { variant: "dot" } | { variant: "count"; count: number };

type BaseProps = {
  text: string;
  active?: boolean;
  badge?: Badge;
  className?: string;
};

type ButtonProps = BaseProps & {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

type LinkProps = BaseProps & {
  to: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

export type PillButtonProps = ButtonProps | LinkProps;

export default function PillButton(props: PillButtonProps) {
  const { text, active, badge, className } = props;

  const classes = [
    "pill-btn",
    active ? "pill-btn--active" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="pill-btn__content">
      <span className="pill-btn__text">{text}</span>
      {badge?.variant === "dot" && (
        <span className="pill-btn__badge pill-btn__badge--dot" />
      )}
      {badge?.variant === "count" && (
        <span className="pill-btn__badge pill-btn__badge--count">
          {badge.count}
        </span>
      )}
    </span>
  );

  if ("to" in props) {
    return (
      <Link
        to={props.to}
        className={classes}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      onClick={props.onClick}
      type={props.type || "button"}
      disabled={props.disabled}
      aria-pressed={active || undefined}
    >
      {content}
    </button>
  );
}
