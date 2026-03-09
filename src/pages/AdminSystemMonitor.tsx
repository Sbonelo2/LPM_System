import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Card from '../components/Card';
import TableComponent, { type TableColumn } from '../components/TableComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import Snackbar from '../components/Snackbar';
import { formatDate, formatDateTime } from "../utils/dateUtils";

type Service = {
  id: string;
  service_name: string;
  is_enabled: boolean;
  uptime_percent: number;
};

type ActiveUserMetric = {
  metric: string;
  value: number;
  status: string;
};

type ErrorMetric = {
  type: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
};

const AdminSystemMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [systemStats, setSystemStats] = useState({
    total_users: 0,
    active_users_1h: 0,
    total_documents: 0,
    total_placements: 0,
    critical_errors_24h: 0,
    health_status: 'Healthy',
    timestamp: new Date().toISOString()
  });
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchData = async () => {
    try {
      // Fetch system health summary using RPC
      const { data: healthSummary, error: healthError } = await supabase.rpc('get_system_health_summary');
      if (healthError) {
        console.warn("RPC call failed, using fallback:", healthError);
        // Fallback: manually fetch if RPC is not available or fails
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: docsCount } = await supabase.from('documents').select('*', { count: 'exact', head: true });
        
        // learner_placements might not exist or be empty, handle safely
        let placementsCount = 0;
        try {
          const { count } = await supabase.from('learner_placements').select('*', { count: 'exact', head: true });
          placementsCount = count || 0;
        } catch (e) {
          console.warn("Placements table error:", e);
        }
        
        setSystemStats(prev => ({
          ...prev,
          total_users: usersCount || 0,
          total_documents: docsCount || 0,
          total_placements: placementsCount
        }));
      } else if (healthSummary) {
        setSystemStats(healthSummary);
      }

      // Fetch service status
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_status')
        .select('*')
        .order('service_name');
      
      if (serviceError) throw serviceError;
      setServices(serviceData || []);

    } catch (err: any) {
      console.error("Error fetching monitoring data:", err);
      // Don't show snackbar on every interval failure to avoid noise
      if (loading) setSnackbarMessage(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleToggleService = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('service_status')
        .update({ is_enabled: !service.is_enabled, last_checked_at: new Date().toISOString() })
        .eq('id', service.id);

      if (error) throw error;
      
      setServices(prev => prev.map(s => 
        s.id === service.id ? { ...s, is_enabled: !s.is_enabled } : s
      ));
      setSnackbarMessage(`${service.service_name} status updated.`);
    } catch (err: any) {
      setSnackbarMessage(`Update failed: ${err.message}`);
    }
  };

  const activeUsers: ActiveUserMetric[] = [
    { metric: 'Currently Online', value: systemStats.active_users_1h, status: systemStats.active_users_1h > 10 ? 'Active' : 'Stable' },
    { metric: 'Total Users', value: systemStats.total_users, status: 'Growth Window' },
  ];

  const errorMetrics: ErrorMetric[] = [
    { type: 'Critical Errors', count: systemStats.critical_errors_24h, severity: 'high' },
    { type: 'Placements Active', count: systemStats.total_placements, severity: 'low' },
    { type: 'Documents Managed', count: systemStats.total_documents, severity: 'low' },
  ];

  const peakUsers = Math.max(...activeUsers.map((item) => item.value), 1);
  const maxErrorCount = Math.max(...errorMetrics.map((item) => item.count), 1);

  const serviceColumns: TableColumn<Service>[] = useMemo(
    () => [
      { key: 'service_name', header: 'Service' },
      {
        key: 'is_enabled',
        header: 'Status',
        render: (service: Service) => (
          <label className="monitor-toggle">
            <input
              type="checkbox"
              checked={service.is_enabled}
              onChange={() => handleToggleService(service)}
            />
            <span>{service.is_enabled ? 'Online' : 'Offline'}</span>
          </label>
        ),
      },
      { 
        key: 'uptime_percent', 
        header: 'Uptime',
        render: (row) => `${row.uptime_percent}%`
      },
    ],
    [],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="facilitator-dashboard-content">
      <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />
      <div className="dashboard-header">
        <h2>SYSTEM MONITOR</h2>
        <span className="monitor-live-indicator" aria-label="System live status">
          <span className="monitor-live-indicator__dot" />
        </span>
      </div>

      <div className="monitor-grid">
        <Card>
          <h3>System Health</h3>
          <div className="monitor-health-list">
            <div className="monitor-health-item">
              <span>Health Status</span>
              <strong className={`monitor-status-pill ${systemStats.health_status === 'Healthy' ? 'monitor-status-pill--healthy' : 'monitor-status-pill--degraded'}`}>
                {systemStats.health_status}
              </strong>
            </div>
            <div className="monitor-health-item">
              <span>Total Data Load</span>
              <strong>{Math.min(100, (systemStats.total_documents / 1000) * 100).toFixed(1)}%</strong>
            </div>
            <div className="monitor-progress-track" aria-label="Update progress">
              <div
                className="monitor-progress-fill"
                style={{ width: `${Math.min(100, (systemStats.total_documents / 1000) * 100)}%` }}
              />
            </div>
            <div className="monitor-health-item">
              <span>Last Scan</span>
              <strong>{formatDateTime(systemStats.timestamp)}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <h3>User Metrics</h3>
          <div className="monitor-metric-list">
            {activeUsers.map((metric) => (
              <div key={metric.metric} className="monitor-metric-item">
                <div className="monitor-metric-top">
                  <span>{metric.metric}</span>
                  <strong>{metric.value}</strong>
                </div>
                <div className="monitor-bar-track" aria-hidden="true">
                  <div
                    className="monitor-bar-fill monitor-bar-fill--users"
                    style={{ width: `${(metric.value / peakUsers) * 100}%` }}
                  />
                </div>
                <small>{metric.status}</small>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3>Service Control</h3>
          <TableComponent
            columns={serviceColumns}
            data={services}
            caption="Live Service Controls"
          />
        </Card>

        <Card>
          <h3>Database Statistics</h3>
          <div className="monitor-metric-list">
            {errorMetrics.map((metric) => (
              <div key={metric.type} className="monitor-metric-item">
                <div className="monitor-metric-top">
                  <span>{metric.type}</span>
                  <strong>{metric.count}</strong>
                </div>
                <div className="monitor-bar-track" aria-hidden="true">
                  <div
                    className={`monitor-bar-fill monitor-bar-fill--${metric.severity}`}
                    style={{ width: `${(metric.count / maxErrorCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemMonitor;
