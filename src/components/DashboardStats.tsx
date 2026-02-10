import React from 'react';
import './DashboardStats.css';

interface DashboardStatsProps {
  myPlacements?: number;
  activePlacement?: number;
  pendingConfirmation?: number;
  profileStatus?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  myPlacements = 1,
  activePlacement = 0,
  pendingConfirmation = 0,
  profileStatus = 'ACTIVE',
}) => {
  return (
    <div className="dashboard-stats">
      <div className="stat-box">
        <h3>My Placements</h3>
        <p className="stat-number">{myPlacements}</p>
      </div>
      
      <div className="stat-box">
        <h3>Active Placement</h3>
        <p className="stat-number">{activePlacement}</p>
      </div>
      
      <div className="stat-box">
        <h3>Pending Confirmation</h3>
        <p className="stat-number">{pendingConfirmation}</p>
      </div>
      
      <div className="stat-box">
        <h3>Profile Status</h3>
        <p className="stat-status">{profileStatus}</p>
      </div>
    </div>
  );
};

export default DashboardStats;
