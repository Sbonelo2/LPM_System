import React, { useMemo, useState } from 'react';
import SideBar from '../components/SideBar';
import Card from '../components/Card';
import TableComponent, { type TableColumn } from '../components/TableComponent';
import './Dashboard.css';
import './AdminSystemMonitor.css';

type Service = {
  name: string;
  enabled: boolean;
  uptime: string;
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
  const [services, setServices] = useState<Service[]>([
    { name: 'Authentication Service', enabled: true, uptime: '99.98%' },
    { name: 'Notifications Service', enabled: true, uptime: '99.72%' },
    { name: 'Document Storage', enabled: true, uptime: '99.91%' },
  ]);

  const systemHealth = {
    healthStatus: 'Healthy',
    updatesPercent: 92,
    lastDowntime: '2026-02-10 01:45 UTC (12m)',
  };

  const activeUsers: ActiveUserMetric[] = [
    { metric: 'Currently Online', value: 184, status: 'Stable' },
    { metric: 'Peak Today', value: 326, status: 'High Load Window' },
  ];

  const errorMetrics: ErrorMetric[] = [
    { type: 'Critical Errors', count: 2, severity: 'high' },
    { type: 'Warnings', count: 17, severity: 'medium' },
    { type: 'Information Logs', count: 142, severity: 'low' },
  ];

  const peakUsers = Math.max(...activeUsers.map((item) => item.value));
  const maxErrorCount = Math.max(...errorMetrics.map((item) => item.count));

  const serviceColumns: TableColumn<Service>[] = useMemo(
    () => [
      { key: 'name', header: 'Service' },
      {
        key: 'enabled',
        header: 'Status',
        render: (service: Service) => (
          <label className="monitor-toggle">
            <input
              type="checkbox"
              checked={service.enabled}
              onChange={() =>
                setServices((prev) =>
                  prev.map((item) =>
                    item.name === service.name
                      ? { ...item, enabled: !item.enabled }
                      : item,
                  ),
                )
              }
            />
            <span>{service.enabled ? 'Online' : 'Offline'}</span>
          </label>
        ),
      },
      { key: 'uptime', header: 'Uptime' },
    ],
    [],
  );

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="dashboard-content">
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
                <strong className="monitor-status-pill monitor-status-pill--healthy">
                  {systemHealth.healthStatus}
                </strong>
              </div>
              <div className="monitor-health-item">
                <span>Updates</span>
                <strong>{systemHealth.updatesPercent}%</strong>
              </div>
              <div className="monitor-progress-track" aria-label="Update progress">
                <div
                  className="monitor-progress-fill"
                  style={{ width: `${systemHealth.updatesPercent}%` }}
                />
              </div>
              <div className="monitor-health-item">
                <span>Last Downtime</span>
                <strong>{systemHealth.lastDowntime}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <h3>Performance Metrics</h3>
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
            <h3>Services</h3>
            <TableComponent
              columns={serviceColumns}
              data={services}
              caption="Service Status Controls"
            />
          </Card>

          <Card>
            <h3>Error Summary</h3>
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
    </div>
  );
};

export default AdminSystemMonitor;
