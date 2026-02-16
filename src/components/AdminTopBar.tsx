import ProfileImageUpload from "./ProfileImageUpload";
import "./AdminTopBar.css";
import { useNavigate } from "react-router-dom";

type Props = {
  title?: string;
  subtitle?: string;
  userName?: string;
  profilePath?: string;
  flush?: boolean;
};

export default function AdminTopBar({
  title = "Learner Placement System",
  subtitle,
  userName = "Dwanyne",
  profilePath,
  flush = true,
}: Props) {
  const navigate = useNavigate();

  return (
    <header className={`admin-topbar${flush ? " admin-topbar--flush" : ""}`}>
      <div className="admin-topbar__titles">
        <h1 className="admin-topbar__title">{title}</h1>
        {subtitle && <div className="admin-topbar__subtitle">{subtitle}</div>}
      </div>
      <button
        type="button"
        className="admin-topbar__user"
        onClick={() => profilePath && navigate(profilePath)}
        disabled={!profilePath}
      >
        <span className="admin-topbar__name">{userName}</span>
        <ProfileImageUpload editable={false} size={44} />
      </button>
    </header>
  );
}
