
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import './Notifications.css';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  details?: string; 
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, sortDirection]);

  const openNotificationModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  const sortNotifications = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filterNotifications = () => {
    setFilterReadStatus(prevStatus => {
      if (prevStatus === 'all') return 'unread';
      if (prevStatus === 'unread') return 'read';
      return 'all';
    });
  };

  const closeNotificationModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  if (loading && notifications.length === 0) {
    return <LoadingSpinner />;
  }

  const displayedNotifications = notifications
    .filter(notification => {
      if (filterReadStatus === 'read') return notification.read;
      if (filterReadStatus === 'unread') return !notification.read;
      return true;
    });

  return (
    <div className="notifications-page">
      <h2>NOTIFICATIONS</h2>
      <Card className="notifications-main-card">
        <div className="notifications-header-icons">
          <Button onClick={refreshNotifications} variant="ghost" text="Refresh" />
          <Button onClick={markAllAsRead} variant="ghost" text="Mark All Read" />
          <Button onClick={sortNotifications} variant="ghost" text={sortDirection === 'asc' ? "Sort: Oldest First" : "Sort: Newest First"} />
          <Button onClick={filterNotifications} variant="ghost" text={`Filter: ${filterReadStatus.charAt(0).toUpperCase() + filterReadStatus.slice(1)}`} />
        </div>
        {displayedNotifications.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>No notifications found.</p>
        ) : (
          <div className="notifications-list">
            {displayedNotifications.map(notification => (
              <Card key={notification.id} className={"notification-item " + (notification.read ? "read" : "unread")}>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <span className="notification-timestamp">{new Date(notification.created_at).toLocaleString()}</span>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => openNotificationModal(notification)} variant="primary">View</Button>
                  {!notification.read && (
                    <Button onClick={() => markAsRead(notification.id)} variant="secondary">Mark as Read</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {showModal && selectedNotification && (
        <Modal
          isOpen={showModal}
          onClose={closeNotificationModal}
          title="Notification Details"
        >
          <div style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>{selectedNotification.message}</h3>
            {selectedNotification.details && (
              <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>{selectedNotification.details}</p>
            )}
            <p className="notification-timestamp" style={{ color: '#666', fontSize: '14px' }}>
              Received: {new Date(selectedNotification.created_at).toLocaleString()}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Notifications;
