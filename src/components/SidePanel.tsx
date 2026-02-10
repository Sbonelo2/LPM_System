import PillButton from "./PillButton";
import type { PillButtonProps } from "./PillButton";
import "./SidePanel.css";

type SidePanelItem = PillButtonProps & {
  id: string;
};

type Props = {
  title?: string;
  items: SidePanelItem[];
  bottomItem?: SidePanelItem;
  className?: string;
};

export default function SidePanel({
  title,
  items,
  bottomItem,
  className,
}: Props) {
  return (
    <aside className={`side-panel${className ? ` ${className}` : ""}`}>
      {title && <h2 className="side-panel__title">{title}</h2>}

      <nav className="side-panel__nav">
        {items.map((item) => (
          <PillButton
            key={item.id}
            {...item}
            className={`side-panel__pill${item.className ? ` ${item.className}` : ""}`}
          />
        ))}
      </nav>

      {bottomItem && (
        <div className="side-panel__bottom">
          <PillButton
            {...bottomItem}
            className={`side-panel__pill${bottomItem.className ? ` ${bottomItem.className}` : ""}`}
          />
        </div>
      )}
    </aside>
  );
}


//example usage
{/* <SidePanel
        title="Learner Placement System"
        items={[
          { id: "dash", text: "Dashboard", to: "/dashboard", active: true },
          { id: "docs", text: "Documents", to: "/documents" },
          {
            id: "notif",
            text: "Notifications",
            to: "/notifications",
            badge: { variant: "dot" },
          },
        ]}
        bottomItem={{ id: "out", text: "Sign Out", onClick: signOut }}
      /> */}