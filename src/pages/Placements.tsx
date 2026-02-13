import React from "react";
import Card from "../components/Card";
import TableComponent from "../components/TableComponent";
import "./Placements.css";

type PlacementRow = {
  host: string;
  program: string;
  status: string;
  startDate: string;
  endDate: string;
};

const Placements: React.FC = () => {
  const columns = [
    { key: "host", header: "Host" },
    { key: "program", header: "Program" },
    { key: "status", header: "Status" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
  ] as const;

  const data: PlacementRow[] = [];

  return (
    <div className="placements-page">
      <div className="placements-header">
        <h2>My Placements</h2>
      </div>

      <div className="placements-table">
        <Card>
          <TableComponent
            columns={[...columns]}
            data={data}
            caption="Your specific placements will be listed here."
          />
        </Card>
      </div>
    </div>
  );
};

export default Placements;
