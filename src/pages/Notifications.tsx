import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import './Notifications.css';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Snackbar from '../components/Snackbar';
import InputField from '../components/InputField';

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
  role: string;
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
  const [recipientHistory, setRecipientHistory] = useState<Notification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  
  // Form states for Create/Edit
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [formMessage, setFormMessage] = useState<string>("");
  const [formDetails, setFormDetails] = useState<string>("");
  const [formCanReply, setFormCanReply] = useState<boolean>(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState<string>("");

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
      let query = supabase.from('notifications').select('*');
      if (dbRole !== 'super_admin' && user?.email !== 'office@admin.com') {
        query = query.eq('user_id', user.id);
      }
      const { data: notifs, error: nErr } = await query.order('created_at', { ascending: false });
      if (nErr) throw nErr;

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
        .select('id, full_name, email, role')
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

  const handleOpenView = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
    setReplyMessage("");
    
    if (isSuperAdmin) {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', notification.user_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRecipientHistory(data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }

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
        can_reply: true,
        created_by: validCreatedBy,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      setSnackbarMessage("Reply sent successfully.");
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
    setSelectedGroups([]);
    setFormMessage("");
    setFormDetails("");
    setFormCanReply(false);
    setShowManageModal(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setSelectedGroups([notification.user_id]); // This might not map well to groups, but edits are rare for groups
    setFormMessage(notification.message);
    setFormDetails(notification.details || "");
    setFormCanReply(notification.can_reply);
    setShowManageModal(true);
  };

  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  const toggleGroup = (groupValue: string) => {
    if (groupValue === "GROUP_ALL") {
      if (selectedGroups.includes("GROUP_ALL")) {
        setSelectedGroups([]);
      } else {
        setSelectedGroups(["GROUP_ALL", "GROUP_LEARNER", "GROUP_MENTOR", "GROUP_FACILITATOR", "GROUP_SUPER_ADMIN"]);
      }
      return;
    }

    setSelectedGroups(prev => {
      let newGroups;
      if (prev.includes(groupValue)) {
        newGroups = prev.filter(g => g !== groupValue && g !== "GROUP_ALL");
      } else {
        newGroups = [...prev, groupValue];
        if (newGroups.length === 4 && !newGroups.includes("GROUP_ALL")) {
          // If all individual groups are selected, add GROUP_ALL
          // (Actually it's easier to just keep them separate)
        }
      }
      return newGroups;
    });
  };

  const saveNotification = async () => {
    if (selectedGroups.length === 0 || !formMessage) {
      setSnackbarMessage("Please select at least one recipient group and enter a message.");
      return;
    }

    setProcessing(true);
    try {
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const validCreatedBy = user?.id && isUuid(user.id) ? user.id : null;

      let targetUserIdsSet = new Set<string>();

      selectedGroups.forEach(groupValue => {
        if (groupValue === "GROUP_ALL") {
          profiles.forEach(p => targetUserIdsSet.add(p.id));
        } else if (groupValue === "GROUP_LEARNER") {
          profiles.filter(p => p.role === "learner").forEach(p => targetUserIdsSet.add(p.id));
        } else if (groupValue === "GROUP_MENTOR") {
          profiles.filter(p => p.role === "mentor").forEach(p => targetUserIdsSet.add(p.id));
        } else if (groupValue === "GROUP_FACILITATOR") {
          profiles.filter(p => p.role === "facilitator" || p.role === "admin").forEach(p => targetUserIdsSet.add(p.id));
        } else if (groupValue === "GROUP_SUPER_ADMIN") {
          profiles.filter(p => p.role === "super_admin").forEach(p => targetUserIdsSet.add(p.id));
        } else if (isUuid(groupValue)) {
          // In case of single user edits
          targetUserIdsSet.add(groupValue);
        }
      });

      const targetUserIds = Array.from(targetUserIdsSet);

      if (targetUserIds.length === 0) {
        throw new Error("No users found in the selected groups.");
      }

      const payloads = targetUserIds.map(uid => ({
        user_id: uid,
        message: formMessage,
        details: formDetails,
        can_reply: formCanReply,
        created_by: validCreatedBy,
      }));

      if (selectedNotification && payloads.length === 1) {
        const { error } = await supabase.from('notifications').update(payloads[0]).eq('id', selectedNotification.id);
        if (error) throw error;
        setSnackbarMessage("Notification updated successfully.");
      } else {
        // Handle bulk insert in chunks if very large, but usually fine for a few hundred
        const { error } = await supabase.from('notifications').insert(payloads);
        if (error) throw error;
        setSnackbarMessage(`Notification sent to ${payloads.length} users.`);
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

  const groupOptions = [
    { label: "All Users", value: "GROUP_ALL" },
    { label: "Learners", value: "GROUP_LEARNER" },
    { label: "Mentors", value: "GROUP_MENTOR" },
    { label: "Facilitators", value: "GROUP_FACILITATOR" },
    { label: "Super Admins", value: "GROUP_SUPER_ADMIN" }
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
      ) : (
        <Card className="notifications-main-card">
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No notifications found.</p>
          ) : (
            <div className="notifications-list">
              {notifications.map(n => (
                <Card key={n.id} className={"notification-item " + (n.read ? "read" : "unread")}>
                  <div className="notification-content">
                    {isSuperAdmin && <span style={{fontSize: '12px', color: '#666', fontWeight: 'bold'}}>To: {n.recipient_name}</span>}
                    <p style={{fontWeight: n.read ? 'normal' : 'bold'}}>{n.message}</p>
                    <span className="notification-timestamp">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div className="notification-actions">
                    <Button onClick={() => handleOpenView(n)} variant="primary">View</Button>
                    {isSuperAdmin && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span onClick={() => handleEditNotification(n)} style={{ cursor: "pointer", color: "var(--primary-color)" }} title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" /></svg>
                        </span>
                        <span onClick={() => handleDeleteNotification(n)} style={{ cursor: "pointer", color: "var(--secondary-color)" }} title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* View Modal with History */}
      {showViewModal && selectedNotification && (
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={isSuperAdmin ? `History: ${selectedNotification.recipient_name}` : "Notification"}>
          <div style={{ padding: '20px', color: '#000', maxHeight: '70vh', overflowY: 'auto' }}>
            {isSuperAdmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loadingHistory ? <LoadingSpinner /> : recipientHistory.length === 0 ? <p>No history found.</p> : recipientHistory.map(h => (
                  <div key={h.id} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #eee', background: h.id === selectedNotification.id ? '#f0f9ff' : '#fff' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#000' }}>{h.message}</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#000', whiteSpace: 'pre-wrap' }}>{h.details}</p>
                    <span style={{ fontSize: '11px', color: '#666' }}>{new Date(h.created_at).toLocaleString()} {h.read ? '• Read' : '• Unread'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <h3 style={{ marginBottom: '10px', color: '#000', fontWeight: 'bold' }}>{selectedNotification.message}</h3>
                <p style={{ color: '#000', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '16px' }}>
                  {selectedNotification.details || "No additional details provided."}
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Received: {new Date(selectedNotification.created_at).toLocaleString()}
                </p>
              </div>
            )}
            
            {selectedNotification.can_reply && selectedNotification.created_by && !isSuperAdmin && (
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
            
            {(isSuperAdmin || !selectedNotification.can_reply) && (
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
            <div className="recipient-checklist" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#000' }}>Recipients:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {groupOptions.map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedGroups.includes(option.value)} 
                      onChange={() => toggleGroup(option.value)} 
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <InputField label="Subject / Message" value={formMessage} onChange={setFormMessage} required placeholder="Quick summary" />
            <div className="form-group">
              <label className="form-label" style={{ color: '#000' }}>Full Details</label>
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
