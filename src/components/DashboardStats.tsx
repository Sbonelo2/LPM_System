import React from 'react';
import './DashboardStats.css';

interface Stat {
  label: string;
  value: string | number;
}

interface DashboardStatsProps {
  stats: Stat[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="dashboard-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-box">
          <h3>{stat.label}</h3>
          <p className="stat-number">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
