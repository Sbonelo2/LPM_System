import React, { useState } from 'react';
import "./CoordinatorReports.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import Dropdown from "../components/Dropdown";
import InputField from "../components/InputField";

const CoordinatorReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'placements' | 'audit'>('placements');
  const [timePeriod, setTimePeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sample data
  const allPlacementsData = [
    { name: "John Smith", host: "ABC Company", startDate: "2024-01-15", status: "Active", duration: "3 months" },
    { name: "Jane Doe", host: "XYZ Organization", startDate: "2023-12-01", status: "Completed", duration: "6 months" },
    { name: "Mike Johnson", host: "Tech Solutions Ltd", startDate: "2024-02-01", status: "Pending", duration: "2 weeks" },
    { name: "Sarah Wilson", host: "Global Tech", startDate: "2023-11-15", status: "Active", duration: "4 months" },
    { name: "Tom Brown", host: "Innovation Corp", startDate: "2024-01-20", status: "Completed", duration: "3 months" }
  ];

  const allAuditData = [
    { 
      timestamp: "2024-02-18 10:30:45", 
      user: "John Manager", 
      action: "Create", 
      module: "Host Management", 
      details: "Created new host: ABC Company", 
      ipAddress: "192.168.1.100" 
    },
    { 
      timestamp: "2024-02-18 09:15:22", 
      user: "Jane Supervisor", 
      action: "Update", 
      module: "Learner Placement", 
      details: "Updated placement status for John Smith", 
      ipAddress: "192.168.1.101" 
    },
    { 
      timestamp: "2024-02-18 08:45:10", 
      user: "Mike Director", 
      action: "Login", 
      module: "Authentication", 
      details: "User logged in successfully", 
      ipAddress: "192.168.1.102" 
    },
    { 
      timestamp: "2024-02-17 16:20:33", 
      user: "Admin User", 
      action: "Delete", 
      module: "Host Management", 
      details: "Deleted host: Old Company", 
      ipAddress: "192.168.1.103" 
    },
    { 
      timestamp: "2024-02-17 14:30:15", 
      user: "Sarah Coordinator", 
      action: "Update", 
      module: "Documents", 
      details: "Updated document requirements", 
      ipAddress: "192.168.1.104" 
    },
    { 
      timestamp: "2024-02-17 11:22:18", 
      user: "Tom Admin", 
      action: "Create", 
      module: "User Management", 
      details: "Created new user account", 
      ipAddress: "192.168.1.105" 
    },
    { 
      timestamp: "2024-02-16 15:45:30", 
      user: "Lisa Supervisor", 
      action: "Update", 
      module: "Host Management", 
      details: "Modified host contact information", 
      ipAddress: "192.168.1.106" 
    },
    { 
      timestamp: "2024-02-16 13:10:45", 
      user: "David Coordinator", 
      action: "Login", 
      module: "Authentication", 
      details: "User logged in successfully", 
      ipAddress: "192.168.1.107" 
    },
    { 
      timestamp: "2024-02-16 10:30:22", 
      user: "Emma Manager", 
      action: "Delete", 
      module: "Documents", 
      details: "Removed outdated document", 
      ipAddress: "192.168.1.108" 
    },
    { 
      timestamp: "2024-02-15 16:55:18", 
      user: "Chris Admin", 
      action: "Create", 
      module: "Reports", 
      details: "Generated monthly report", 
      ipAddress: "192.168.1.109" 
    },
    { 
      timestamp: "2024-02-15 14:20:33", 
      user: "Amy Supervisor", 
      action: "Update", 
      module: "Learner Placement", 
      details: "Changed placement dates", 
      ipAddress: "192.168.1.110" 
    },
    { 
      timestamp: "2024-02-15 11:45:10", 
      user: "Robert Coordinator", 
      action: "Login", 
      module: "Authentication", 
      details: "User logged in successfully", 
      ipAddress: "192.168.1.111" 
    },
    { 
      timestamp: "2024-02-14 16:30:45", 
      user: "Michelle Admin", 
      action: "Export", 
      module: "Reports", 
      details: "Exported placement data to CSV", 
      ipAddress: "192.168.1.112" 
    },
    { 
      timestamp: "2024-02-14 13:15:22", 
      user: "Steven Manager", 
      action: "Import", 
      module: "Host Management", 
      details: "Imported host list from Excel", 
      ipAddress: "192.168.1.113" 
    },
    { 
      timestamp: "2024-02-14 10:45:33", 
      user: "Laura Supervisor", 
      action: "Approve", 
      module: "Learner Placement", 
      details: "Approved pending placement request", 
      ipAddress: "192.168.1.114" 
    },
    { 
      timestamp: "2024-02-13 15:20:18", 
      user: "Kevin Coordinator", 
      action: "Reject", 
      module: "Documents", 
      details: "Rejected incomplete document submission", 
      ipAddress: "192.168.1.115" 
    },
    { 
      timestamp: "2024-02-13 12:10:45", 
      user: "Nicole Admin", 
      action: "Archive", 
      module: "Reports", 
      details: "Archived old placement reports", 
      ipAddress: "192.168.1.116" 
    },
    { 
      timestamp: "2024-02-13 09:30:22", 
      user: "Jason Manager", 
      action: "Restore", 
      module: "Host Management", 
      details: "Restored deleted host record", 
      ipAddress: "192.168.1.117" 
    }
  ];

  // Filter placements data
  const getFilteredPlacementsData = () => {
    let filtered = allPlacementsData;
    
    if (status !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }
    
    return filtered;
  };

  // Filter audit data
  const getFilteredAuditData = () => {
    let filtered = allAuditData;
    
    if (actionType !== 'all') {
      filtered = filtered.filter(item => item.action.toLowerCase() === actionType.toLowerCase());
    }
    
    if (startDate) {
      filtered = filtered.filter(item => item.timestamp >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(item => item.timestamp <= endDate);
    }
    
    return filtered;
  };

  // Get paginated audit data
  const getPaginatedAuditData = () => {
    const filtered = getFilteredAuditData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get pagination info
  const getPaginationInfo = () => {
    const filtered = getFilteredAuditData();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filtered.length);
    
    return {
      totalPages,
      startItem,
      endItem,
      totalItems: filtered.length
    };
  };

  const renderPlacementsReports = () => (
    <div className="reports-content">
      <div className="reports-header">
        <h2>Placements Reports</h2>
        <div className="reports-filters">
          <Dropdown
            label=""
            value={timePeriod}
            onChange={setTimePeriod}
            options={[
              { label: "All Time Periods", value: "all" },
              { label: "This Week", value: "week" },
              { label: "This Month", value: "month" },
              { label: "This Quarter", value: "quarter" },
              { label: "This Year", value: "year" }
            ]}
            placeholder="Select Time Period"
          />
          <Dropdown
            label=""
            value={status}
            onChange={setStatus}
            options={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" }
            ]}
            placeholder="Select Status"
          />
        </div>
      </div>
      
      <div className="reports-grid">
        <DashboardStats 
          stats={[
            { label: "Total Placements", value: "156" },
            { label: "Active", value: "89" },
            { label: "Completed", value: "23" },
            { label: "Pending", value: "44" }
          ]}
        />
      </div>

      <div className="reports-grid">
        <DashboardStats 
          stats={[
            { label: "Total Hosts", value: "45" },
            { label: "Avg Rating", value: "4.2" },
            { label: "Satisfaction", value: "92%" }
          ]}
        />
      </div>

      <div className="reports-grid">
        <DashboardStats 
          stats={[
            { label: "Total Learners", value: "234" },
            { label: "Completion Rate", value: "78%" },
            { label: "Avg Duration", value: "4.5" }
          ]}
        />
      </div>

      <div className="reports-table-section">
        <h3>Recent Placements</h3>
        <TableComponent
          columns={[
            { header: "Learner Name", key: "name" },
            { header: "Host Company", key: "host" },
            { 
              header: "Status", 
              key: "status",
              render: (item: any) => (
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              )
            },
            { header: "Duration", key: "duration" }
          ]}
          data={getFilteredPlacementsData()}
        />
      </div>
    </div>
  );

  const renderAuditTrails = () => (
    <div className="reports-content">
      <div className="reports-header">
        <h2>Audit Trails</h2>
        <div className="reports-filters">
          <InputField
            label=""
            value={startDate}
            onChange={setStartDate}
            type="date"
            placeholder="Start Date"
          />
          <InputField
            label=""
            value={endDate}
            onChange={setEndDate}
            type="date"
            placeholder="End Date"
          />
          <Dropdown
            label=""
            value={actionType}
            onChange={setActionType}
            options={[
              { label: "All Actions", value: "all" },
              { label: "Create", value: "Create" },
              { label: "Update", value: "Update" },
              { label: "Delete", value: "Delete" },
              { label: "Login", value: "Login" },
              { label: "Export", value: "Export" },
              { label: "Import", value: "Import" },
              { label: "Approve", value: "Approve" },
              { label: "Reject", value: "Reject" },
              { label: "Archive", value: "Archive" },
              { label: "Restore", value: "Restore" }
            ]}
            placeholder="Select Action"
          />
        </div>
      </div>

      <div className="audit-stats">
        <DashboardStats 
          stats={[
            { label: "Total Actions", value: "1,234" },
            { label: "Today", value: "89" },
            { label: "This Week", value: "456" }
          ]}
        />
      </div>

      <div className="audit-table-section">
        <h3>Recent Activity</h3>
        <TableComponent
          columns={[
            { header: "User", key: "user" },
            { 
              header: "Action", 
              key: "action",
              render: (item: any) => (
                <span className={`action-badge ${item.action.toLowerCase()}`}>
                  {item.action}
                </span>
              )
            },
            { header: "Module", key: "module" },
            { header: "Details", key: "details" }
          ]}
          data={getPaginatedAuditData()}
        />
        
        {/* Pagination Controls */}
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {getPaginationInfo().startItem}-{getPaginationInfo().endItem} of {getPaginationInfo().totalItems} results
          </div>
          <div className="pagination-buttons">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-page-info">
              Page {currentPage} of {getPaginationInfo().totalPages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(getPaginationInfo().totalPages, prev + 1))}
              disabled={currentPage === getPaginationInfo().totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-content-wrapper">
        <div className="reports-header-main">
          <h1>Coordinator Reports</h1>
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'placements' ? 'active' : ''}`}
              onClick={() => setActiveTab('placements')}
            >
              Placements Reports
            </button>
            <button
              className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Trails
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'placements' && renderPlacementsReports()}
          {activeTab === 'audit' && renderAuditTrails()}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorReports;
