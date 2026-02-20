import React, { useState } from 'react';
import "./CoordinatorReports.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import Dropdown from "../components/Dropdown";
import InputField from "../components/InputField";

const QAReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quality' | 'audit'>('quality');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sample QA data
  const allQualityData = [
    { 
      id: "QA-001", 
      learner: "John Smith", 
      host: "ABC Company", 
      issue: "Missing documentation", 
      severity: "Medium", 
      status: "Open", 
      date: "2024-02-18",
      reviewer: "Sarah Wilson"
    },
    { 
      id: "QA-002", 
      learner: "Jane Doe", 
      host: "XYZ Organization", 
      issue: "Placement agreement incomplete", 
      severity: "High", 
      status: "Resolved", 
      date: "2024-02-17",
      reviewer: "Tom Brown"
    },
    { 
      id: "QA-003", 
      learner: "Mike Johnson", 
      host: "Tech Solutions Ltd", 
      issue: "Insurance verification pending", 
      severity: "Low", 
      status: "In Progress", 
      date: "2024-02-16",
      reviewer: "Lisa Davis"
    },
    { 
      id: "QA-004", 
      learner: "Emma Wilson", 
      host: "Global Tech", 
      issue: "Background check delay", 
      severity: "High", 
      status: "Open", 
      date: "2024-02-15",
      reviewer: "Chris Martin"
    },
    { 
      id: "QA-005", 
      learner: "David Brown", 
      host: "Innovation Corp", 
      issue: "Training compliance missing", 
      severity: "Medium", 
      status: "Resolved", 
      date: "2024-02-14",
      reviewer: "Amy Johnson"
    }
  ];

  const allAuditData = [
    { 
      timestamp: "2024-02-18 10:30:45", 
      user: "Sarah Wilson", 
      action: "Create", 
      module: "Quality Assurance", 
      details: "Created QA issue: Missing documentation", 
      ipAddress: "192.168.1.100" 
    },
    { 
      timestamp: "2024-02-18 09:15:22", 
      user: "Tom Brown", 
      action: "Update", 
      module: "Quality Assurance", 
      details: "Updated QA issue status to Resolved", 
      ipAddress: "192.168.1.101" 
    },
    { 
      timestamp: "2024-02-18 08:45:10", 
      user: "Lisa Davis", 
      action: "Create", 
      module: "Quality Assurance", 
      details: "Created QA issue: Insurance verification pending", 
      ipAddress: "192.168.1.102" 
    },
    { 
      timestamp: "2024-02-17 16:20:33", 
      user: "Chris Martin", 
      action: "Update", 
      module: "Quality Assurance", 
      details: "Updated QA issue priority to High", 
      ipAddress: "192.168.1.103" 
    },
    { 
      timestamp: "2024-02-17 14:30:15", 
      user: "Amy Johnson", 
      action: "Delete", 
      module: "Quality Assurance", 
      details: "Resolved QA issue: Training compliance missing", 
      ipAddress: "192.168.1.104" 
    }
  ];

  // Filter quality data
  const getFilteredQualityData = () => {
    let filtered = allQualityData;
    
    if (status !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }
    
    if (priority !== 'all') {
      filtered = filtered.filter(item => item.severity.toLowerCase() === priority.toLowerCase());
    }
    
    return filtered;
  };

  // Filter audit data
  const getFilteredAuditData = () => {
    let filtered = allAuditData;
    
    if (status !== 'all') {
      filtered = filtered.filter((item: any) => item.action.toLowerCase() === status.toLowerCase());
    }
    
    if (startDate) {
      filtered = filtered.filter((item: any) => item.timestamp >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter((item: any) => item.timestamp <= endDate);
    }
    
    return filtered;
  };

  // Get paginated data
  const getPaginatedQualityData = () => {
    const filtered = getFilteredQualityData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getPaginatedAuditData = () => {
    const filtered = getFilteredAuditData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get pagination info
  const getPaginationInfo = (isQuality: boolean) => {
    const filtered = isQuality ? getFilteredQualityData() : getFilteredAuditData();
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

  const renderQualityReports = () => (
    <div className="reports-content">
      <div className="reports-header">
        <h2>Quality Assurance</h2>
        <div className="reports-filters">
          <Dropdown
            label=""
            value={status}
            onChange={setStatus}
            options={[
              { label: "All Status", value: "all" },
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in progress" },
              { label: "Resolved", value: "resolved" }
            ]}
            placeholder="Select Status"
          />
          <Dropdown
            label=""
            value={priority}
            onChange={setPriority}
            options={[
              { label: "All Priority", value: "all" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" }
            ]}
            placeholder="Select Priority"
          />
        </div>
      </div>
      
      <div className="reports-grid">
        <DashboardStats 
          stats={[
            { label: "Total Issues", value: "156" },
            { label: "Open", value: "23" },
            { label: "In Progress", value: "45" },
            { label: "Resolved", value: "88" }
          ]}
        />
      </div>

      <div className="reports-grid">
        <DashboardStats 
          stats={[
            { label: "High Priority", value: "12" },
            { label: "Avg Resolution Time", value: "3.2 days" },
            { label: "Quality Score", value: "94%" }
          ]}
        />
      </div>

      <div className="reports-table-section">
        <h3>Quality Issues</h3>
        <TableComponent
          columns={[
            { header: "ID", key: "id" },
            { header: "Learner", key: "learner" },
            { header: "Host", key: "host" },
            { header: "Issue", key: "issue" },
            { 
              header: "Severity", 
              key: "severity",
              render: (item: any) => (
                <span className={`action-badge ${item.severity.toLowerCase()}`}>
                  {item.severity}
                </span>
              )
            },
            { 
              header: "Status", 
              key: "status",
              render: (item: any) => (
                <span className={`status-badge ${item.status.toLowerCase().replace(' ', '')}`}>
                  {item.status}
                </span>
              )
            },
            { header: "Date", key: "date" },
            { header: "Reviewer", key: "reviewer" }
          ]}
          data={getPaginatedQualityData()}
        />
        
        {/* Pagination Controls */}
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {getPaginationInfo(true).startItem}-{getPaginationInfo(true).endItem} of {getPaginationInfo(true).totalItems} results
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
              Page {currentPage} of {getPaginationInfo(true).totalPages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(getPaginationInfo(true).totalPages, prev + 1))}
              disabled={currentPage === getPaginationInfo(true).totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditReports = () => (
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
            value={status}
            onChange={setStatus}
            options={[
              { label: "All Actions", value: "all" },
              { label: "Create", value: "Create" },
              { label: "Update", value: "Update" },
              { label: "Delete", value: "Delete" }
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
            Showing {getPaginationInfo(false).startItem}-{getPaginationInfo(false).endItem} of {getPaginationInfo(false).totalItems} results
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
              Page {currentPage} of {getPaginationInfo(false).totalPages}
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(getPaginationInfo(false).totalPages, prev + 1))}
              disabled={currentPage === getPaginationInfo(false).totalPages}
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
        <h1>QA Reports</h1>
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'quality' ? 'active' : ''}`}
            onClick={() => setActiveTab('quality')}
          >
            Quality Assurance
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
        {activeTab === 'quality' && renderQualityReports()}
        {activeTab === 'audit' && renderAuditReports()}
      </div>
    </div>
  </div>
);

};

export default QAReports;