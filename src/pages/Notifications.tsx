import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import './Notifications.css';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Snackbar from '../components/Snackbar';
import TableComponent, { type TableColumn } from '../components/TableComponent';
import InputField from '../components/InputField';
import Dropdown from '../components/Dropdown';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  read: boolean;
  details?: string;
  can_reply: boolean;
  created_by?: string;
  recipient_name?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [dbRole, setDbRole] = useState<string>("");
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // Form states for Create/Edit
  const [formRecipient, setFormRecipient] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");
  const [formDetails, setFormDetails] = useState<string>("");
  const [formCanReply, setFormCanReply] = useState<boolean>(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState<string>("");
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);

  // Determine if Super Admin using DB role
  const isSuperAdmin = dbRole === 'super_admin' || user?.email === 'office@admin.com';

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
      if (data) setDbRole(data.role);
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch notifications
      let query = supabase.from('notifications').select('*');
      if (dbRole !== 'super_admin' && user?.email !== 'office@admin.com') {
        query = query.eq('user_id', user.id);
      }
      const { data: notifs, error: nErr } = await query.order('created_at', { ascending: false });
      if (nErr) throw nErr;

      // 2. Fetch profiles to map names manually (avoids the schema cache error if FK is missing)
      const { data: profs } = await supabase.from('profiles').select('id, full_name');
      const profileMap = (profs || []).reduce((acc: any, p) => {
        acc[p.id] = p.full_name;
        return acc;
      }, {});

      const formatted: Notification[] = (notifs || []).map((n: any) => ({
        ...n,
        recipient_name: profileMap[n.user_id] || 'Unknown User'
      }));
      
      setNotifications(formatted);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  useEffect(() => {
    if (dbRole) {
      fetchNotifications();
      if (isSuperAdmin) fetchProfiles();
    }
  }, [user, dbRole]);

  const handleOpenView = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
    setShowReplyForm(false);
    setReplyMessage("");
    if (!notification.read && !isSuperAdmin) {
      markAsRead(notification.id);
    }
  };

  const handleSendReply = async () => {
    if (!selectedNotification || !selectedNotification.created_by) {
      setSnackbarMessage("Cannot reply: Sender information missing.");
      return;
    }
    if (!replyMessage.trim()) {
      setSnackbarMessage("Please enter a reply message.");
      return;
    }

    setProcessing(true);
    try {
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const validCreatedBy = user?.id && isUuid(user.id) ? user.id : null;

      const payload = {
        user_id: selectedNotification.created_by,
        message: `Re: ${selectedNotification.message}`,
        details: replyMessage,
        can_reply: true, // Allow them to reply back if needed
        created_by: validCreatedBy,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      setSnackbarMessage("Reply sent successfully.");
      setShowReplyForm(false);
      setReplyMessage("");
      setShowViewModal(false);
      fetchNotifications();
    } catch (err: any) {
      setSnackbarMessage(`Failed to send reply: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleAddNotification = () => {
    setSelectedNotification(null);
    setFormRecipient("");
    setFormMessage("");
    setFormDetails("");
    setFormCanReply(false);
    setShowManageModal(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setFormRecipient(notification.user_id);
    setFormMessage(notification.message);
    setFormDetails(notification.details || "");
    setFormCanReply(notification.can_reply);
    setShowManageModal(true);
  };

  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  const saveNotification = async () => {
    if (!formRecipient || !formMessage) {
      setSnackbarMessage("Please select a recipient and enter a message.");
      return;
    }

    setProcessing(true);
    try {
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const validCreatedBy = user?.id && isUuid(user.id) ? user.id : null;

      const payload = {
        user_id: formRecipient,
        message: formMessage,
        details: formDetails,
        can_reply: formCanReply,
        created_by: validCreatedBy,
      };

      if (selectedNotification) {
        const { error } = await supabase.from('notifications').update(payload).eq('id', selectedNotification.id);
        if (error) throw error;
        setSnackbarMessage("Notification updated successfully.");
      } else {
        const { error } = await supabase.from('notifications').insert([payload]);
        if (error) throw error;
        setSnackbarMessage("Notification sent successfully.");
      }

      setShowManageModal(false);
      fetchNotifications();
    } catch (err: any) {
      setSnackbarMessage(`Failed to save: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedNotification) return;
    setProcessing(true);
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', selectedNotification.id);
      if (error) throw error;
      setSnackbarMessage("Notification deleted.");
      setShowDeleteModal(false);
      fetchNotifications();
    } catch (err: any) {
      setSnackbarMessage(`Failed to delete: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const adminColumns: TableColumn<Notification>[] = [
    { key: "recipient_name", header: "Recipient" },
    { key: "message", header: "Message" },
    { 
      key: "can_reply", 
      header: "Reply Allowed",
      render: (n: Notification) => n.can_reply ? "YES" : "NO"
    },
    { 
      key: "created_at", 
      header: "Sent At",
      render: (n: Notification) => new Date(n.created_at).toLocaleString()
    },
    {
      key: "actions",
      header: "Actions",
      render: (n: Notification) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <span onClick={() => handleEditNotification(n)} style={{ cursor: "pointer", color: "var(--primary-color)" }} title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" /></svg>
          </span>
          <span onClick={() => handleDeleteNotification(n)} style={{ cursor: "pointer", color: "var(--secondary-color)" }} title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" /></svg>
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="notifications-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>NOTIFICATIONS {isSuperAdmin ? "MANAGEMENT" : "INBOX"}</h2>
        {isSuperAdmin && <Button text="Send Notification" onClick={handleAddNotification} variant="primary" />}
      </div>

      <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />

      {loading ? (
        <LoadingSpinner />
      ) : isSuperAdmin ? (
        <Card>
          <TableComponent columns={adminColumns} data={notifications} caption="Manage system-wide notifications" />
        </Card>
      ) : (
        <Card className="notifications-main-card">
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No notifications found.</p>
          ) : (
            <div className="notifications-list">
              {notifications.map(n => (
                <Card key={n.id} className={"notification-item " + (n.read ? "read" : "unread")}>
                  <div className="notification-content">
                    <p>{n.message}</p>
                    <span className="notification-timestamp">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div className="notification-actions">
                    <Button onClick={() => handleOpenView(n)} variant="primary">View</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* View Modal */}
      {showViewModal && selectedNotification && (
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Notification">
          <div style={{ padding: '20px', color: '#000' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              <h3 style={{ marginBottom: '10px', color: '#000', fontWeight: 'bold' }}>{selectedNotification.message}</h3>
              <p style={{ color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '16px' }}>
                {selectedNotification.details || "No additional details provided."}
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Received: {new Date(selectedNotification.created_at).toLocaleString()}
              </p>
            </div>
            
            {selectedNotification.can_reply && selectedNotification.created_by && (
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#000' }}>
                  Your Reply:
                </label>
                <textarea
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '2px solid #ddd', 
                    minHeight: '120px',
                    color: '#000',
                    fontSize: '14px',
                    marginBottom: '15px'
                  }}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response here..."
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button text="Cancel" onClick={() => setShowViewModal(false)} variant="ghost" />
                  <Button 
                    text={processing ? "Sending..." : "Send Reply"} 
                    onClick={handleSendReply} 
                    variant="primary" 
                    disabled={processing || !replyMessage.trim()} 
                  />
                </div>
              </div>
            )}
            
            {!selectedNotification.can_reply && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button text="Close" onClick={() => setShowViewModal(false)} variant="primary" />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Manage (Create/Edit) Modal */}
      {showManageModal && (
        <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title={selectedNotification ? "Edit Notification" : "New Notification"}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
            <Dropdown 
              label="Recipient" 
              value={formRecipient} 
              onChange={setFormRecipient} 
              options={profiles.map(p => ({ label: `${p.full_name} (${p.email})`, value: p.id }))} 
              placeholder="Select recipient" 
              required 
            />
            <InputField label="Subject / Message" value={formMessage} onChange={setFormMessage} required placeholder="Quick summary" />
            <div className="form-group">
              <label className="form-label">Full Details</label>
              <textarea 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px', color: '#000' }}
                value={formDetails}
                onChange={(e) => setFormDetails(e.target.value)}
                placeholder="Enter full notification content here..."
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="can_reply" checked={formCanReply} onChange={(e) => setFormCanReply(e.target.checked)} />
              <label htmlFor="can_reply" style={{ cursor: 'pointer', color: '#000' }}>Allow recipient to reply</label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button text="Cancel" onClick={() => setShowManageModal(false)} variant="secondary" />
              <Button text={processing ? "Processing..." : "Send Notification"} onClick={saveNotification} variant="primary" disabled={processing} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete">
          <div style={{ padding: '10px' }}>
            <p style={{ color: '#000' }}>Are you sure you want to delete this notification sent to <strong>{selectedNotification?.recipient_name}</strong>?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button text="Cancel" onClick={() => setShowDeleteModal(false)} variant="secondary" />
              <Button text={processing ? "Deleting..." : "Delete"} onClick={confirmDelete} variant="primary" disabled={processing} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Notifications;
