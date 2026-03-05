import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/Card";
import TableComponent from "../components/TableComponent";
import { formatDate } from "../utils/dateUtils";
import "./Placements.css";

type PlacementRow = {
  id: string;
  host: string;
  program: string;
  status: string;
  startDate: string;
  endDate: string;
};

const Placements: React.FC = () => {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlacements();
    }
  }, [user]);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("learner_placements")
        .select("*")
        .eq("learner_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        host: p.host_name || "Unknown Host",
        program: p.program,
        status: p.status,
        startDate: formatDate(p.start_date),
        endDate: formatDate(p.end_date),
      }));

      setPlacements(formatted);
    } catch (err) {
      console.error("Error fetching placements:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "host", header: "Host" },
    { key: "program", header: "Program" },
    { key: "status", header: "Status" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
  ] as const;

  return (
    <div className="placements-page">
      <div className="placements-header">
        <h2>My Placements</h2>
      </div>

      <div className="placements-table">
        <Card>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading placements...</p>
          ) : (
            <TableComponent
              columns={[...columns]}
              data={placements}
              caption={
                placements.length === 0
                  ? "No placements yet. Your placements will appear here once assigned."
                  : "Your assigned placements"
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Placements;
