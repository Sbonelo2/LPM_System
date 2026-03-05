import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import "./CoordinatorReports.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Dropdown from "../components/Dropdown";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import LineChart from "../components/LineChart";
import Snackbar from "../components/Snackbar";

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  action: string;
  module: string;
  details: string;
}

interface PlacementReport {
  id: string;
  learner_name: string;
  host_name: string;
  program: string;
  status: string;
  start_date: string;
  created_at: string;
}

const CoordinatorReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'placements' | 'audit'>('placements');
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Stats
  const [placementStats, setPlacementStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0
  });
  
  const [auditStats, setAuditStats] = useState({
    total: 0,
    today: 0,
    week: 0
  });

  const [trendData, setTrendData] = useState<{label: string, value: number}[]>([]);

  // Data
  const [placements, setPlacements] = useState<PlacementReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchPlacementsData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch placements
      const { data: lpData, error: lpError } = await supabase
        .from('learner_placements')
        .select('*')
        .order('created_at', { ascending: false });

      if (lpError) throw lpError;

      // 2. Fetch profiles for manual name mapping (more reliable than joins)
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      const profileMap = (profData || []).reduce((acc: any, p) => {
        acc[p.id] = p.full_name || p.email;
        return acc;
      }, {});

      const formatted = (lpData || []).map((p: any) => ({
        id: p.id,
        learner_name: profileMap[p.learner_id] || 'Unknown Learner',
        host_name: p.host_name || 'N/A',
        program: p.program || 'N/A',
        status: p.status || 'Pending',
        start_date: p.start_date,
        created_at: p.created_at
      }));

      setPlacements(formatted);
      
      // Calculate stats
      setPlacementStats({
        total: formatted.length,
        active: formatted.filter(p => p.status?.toLowerCase() === 'active').length,
        completed: formatted.filter(p => p.status?.toLowerCase() === 'completed').length,
        pending: formatted.filter(p => p.status?.toLowerCase() === 'pending').length
      });

      // Calculate trend data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({ 
          label: months[d.getMonth()], 
          month: d.getMonth(),
          year: d.getFullYear(),
          value: 0 
        });
      }

      formatted.forEach(p => {
        const pDate = new Date(p.created_at);
        const trendMonth = last6Months.find(tm => tm.month === pDate.getMonth() && tm.year === pDate.getFullYear());
        if (trendMonth) trendMonth.value++;
      });

      setTrendData(last6Months.map(tm => ({ label: tm.label, value: tm.value })));

    } catch (err: any) {
      console.error("Error fetching placement reports:", err);
      setSnackbarMessage(`Error loading placements: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet, don't crash
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          setAuditLogs([]);
          return;
        }
        throw error;
      }
      
      setAuditLogs(data || []);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      setAuditStats({
        total: (data || []).length,
        today: (data || []).filter(l => l.created_at.startsWith(todayStr)).length,
        week: (data || []).filter(l => new Date(l.created_at) > lastWeek).length
      });
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      setSnackbarMessage(`Error loading audit logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'placements') fetchPlacementsData();
    else fetchAuditLogs();
  }, [activeTab]);

  const filteredPlacements = placements.filter(p => 
    statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase()
  );

  const filteredAudit = auditLogs.filter(l => {
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesStart = !startDate || l.created_at >= startDate;
    const matchesEnd = !endDate || l.created_at <= endDate;
    return matchesAction && matchesStart && matchesEnd;
  });

  const renderPlacementsTab = () => (
    <div className="reports-content animate-fade-in">
      <div className="reports-top-layout">
        <div className="reports-stats-column">
          <DashboardStats 
            stats={[
              { label: "TOTAL PLACEMENTS", value: placementStats.total.toString() },
              { label: "ACTIVE", value: placementStats.active.toString() },
              { label: "COMPLETED", value: placementStats.completed.toString() },
              { label: "PENDING", value: placementStats.pending.toString() }
            ]}
          />
        </div>
        <div className="reports-chart-column">
          <div className="chart-card">
            <h3>Placement Trends (Last 6 Months)</h3>
            <LineChart data={trendData} color="#3b82f6" height={220} />
          </div>
        </div>
      </div>

      <div className="reports-table-card">
        <div className="table-header-row">
          <h3>Recent Placement Activity</h3>
          <div className="filter-row">
            <Dropdown
              label=""
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Pending", value: "pending" }
              ]}
            />
          </div>
        </div>
        <TableComponent
          columns={[
            { header: "Learner", key: "learner_name" },
            { header: "Host", key: "host_name" },
            { header: "Program", key: "program" },
            { 
              header: "Status", 
              key: "status",
              render: (row: any) => (
                <span className={`status-badge ${row.status?.toLowerCase() || 'pending'}`}>
                  {(row.status || 'PENDING').toUpperCase()}
                </span>
              )
            },
            { 
              header: "Date", 
              key: "start_date",
              render: (row: any) => row.start_date ? new Date(row.start_date).toLocaleDateString() : 'N/A'
            }
          ]}
          data={filteredPlacements}
        />
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="reports-content animate-fade-in">
      <div className="reports-stats-section">
        <DashboardStats 
          stats={[
            { label: "TOTAL ACTIONS", value: auditStats.total.toLocaleString() },
            { label: "ACTIONS TODAY", value: auditStats.today.toString() },
            { label: "THIS WEEK", value: auditStats.week.toString() }
          ]}
        />
      </div>

      <div className="reports-table-card">
        <div className="table-header-row">
          <h3>System Audit Trail</h3>
          <div className="filter-row">
            <InputField label="" value={startDate} onChange={setStartDate} type="date" />
            <InputField label="" value={endDate} onChange={setEndDate} type="date" />
            <Dropdown
              label=""
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { label: "All Actions", value: "all" },
                { label: "CREATE", value: "CREATE" },
                { label: "UPDATE", value: "UPDATE" },
                { label: "DELETE", value: "DELETE" },
                { label: "LOGIN", value: "LOGIN" }
              ]}
            />
          </div>
        </div>
        <TableComponent
          columns={[
            { 
              header: "Timestamp", 
              key: "created_at",
              render: (row: any) => new Date(row.created_at).toLocaleString()
            },
            { header: "User", key: "user_email" },
            { 
              header: "Action", 
              key: "action",
              render: (row: any) => (
                <span className={`action-badge action-${row.action?.toLowerCase()}`}>
                  {row.action}
                </span>
              )
            },
            { header: "Module", key: "module" },
            { header: "Details", key: "details" }
          ]}
          data={filteredAudit}
        />
      </div>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-header-main">
        <div className="title-section">
          <h1>REPORTS & ANALYTICS</h1>
          <p>System-wide placement tracking and security audit logs</p>
        </div>
        <div className="tabs-navigation">
          <button
            className={`tab-nav-btn ${activeTab === 'placements' ? 'active' : ''}`}
            onClick={() => setActiveTab('placements')}
          >
            Placements
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Trail
          </button>
        </div>
      </div>

      <div className="reports-body">
        {loading ? <LoadingSpinner /> : (
          activeTab === 'placements' ? renderPlacementsTab() : renderAuditTab()
        )}
      </div>

      <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />
    </div>
  );
};

export default CoordinatorReports;
