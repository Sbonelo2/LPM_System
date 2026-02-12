
import React, { useState, useEffect } from 'react';
import './Notifications.css';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  details?: string; // Add a details field for modal content
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Simulate fetching notifications from an API
    const fetchNotifications = async () => {
      setLoading(true);
      return new Promise<Notification[]>(resolve => {
        setTimeout(() => {
          resolve([
            { id: '1', message: 'Your document "Project Plan" has been approved.', details: 'The project plan for Q3 has been reviewed and approved by the management team. You can now proceed with the implementation phase.', timestamp: '2026-02-10T10:00:00Z', read: false },
            { id: '2', message: 'New policy update: "Data Privacy Policy v2.0".', details: 'The company\'s Data Privacy Policy has been updated to version 2.0. Please review the new policy located in the "Compliance" section of the document repository.', timestamp: '2026-02-09T15:30:00Z', read: true },
            { id: '3', message: 'Reminder: Complete your quarterly report by EOD.', details: 'This is a friendly reminder to complete and submit your quarterly performance report by the end of today. Access the report template from the "Reports" section.', timestamp: '2026-02-08T09:00:00Z', read: false },
          ]);
        }, 1000);
      });
    };

    fetchNotifications().then(data => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const refreshNotifications = () => {
    // Re-fetch notifications or update state
    setLoading(true);
    // Simulate re-fetching
    useEffect(() => {
      // Simulate fetching notifications from an API
      const fetchNotifications = async () => {
        setLoading(true);
        return new Promise<Notification[]>(resolve => {
          setTimeout(() => {
            resolve([
              { id: '1', message: 'Your document "Project Plan" has been approved.', details: 'The project plan for Q3 has been reviewed and approved by the management team. You can now proceed with the implementation phase.', timestamp: '2026-02-10T10:00:00Z', read: false },
              { id: '2', message: 'New policy update: "Data Privacy Policy v2.0".', details: 'The company\'s Data Privacy Policy has been updated to version 2.0. Please review the new policy located in the "Compliance" section of the document repository.', timestamp: '2026-02-09T15:30:00Z', read: true },
              { id: '3', message: 'Reminder: Complete your quarterly report by EOD.', details: 'This is a friendly reminder to complete and submit your quarterly performance report by the end of today. Access the report template from the "Reports" section.', timestamp: '2026-02-08T09:00:00Z', read: false },
            ]);
          }, 1000);
        });
      };
    }, []);

    fetchNotifications().then(data => {
      setNotifications(data);
      setLoading(false);
    });
  };

  const sortNotifications = () => {
    // Placeholder for sorting logic
    console.log("Sorting notifications...");
  };

  const filterNotifications = () => {
    // Placeholder for filtering logic
    console.log("Filtering notifications...");
  };

  const closeNotificationModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="notifications-page">
      <h2>NOTIFICATIONS</h2>
      <Card className="notifications-main-card">
        <div className="notifications-header-icons">
          <Button onClick={refreshNotifications} variant="ghost" text="Refresh" />
          <Button onClick={markAllAsRead} variant="ghost" text="Mark All Read" />
          <Button onClick={sortNotifications} variant="ghost" text="Sort" />
          <Button onClick={filterNotifications} variant="ghost" text="Filter" />
        </div>
        {notifications.length === 0 ? (
          <p>No new notifications.</p>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <Card key={notification.id} className={"notification-item " + (notification.read ? "read" : "unread")}>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <span className="notification-timestamp">{new Date(notification.timestamp).toLocaleString()}</span>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => openNotificationModal(notification)} variant="ghost">View</Button>
                  {!notification.read && (
                    <Button onClick={() => markAsRead(notification.id)}>Mark as Read</Button>
                  )}
                  <Button onClick={() => deleteNotification(notification.id)} variant="secondary">Delete</Button>
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
          title={selectedNotification.message}
        >
          <p>{selectedNotification.details}</p>
          <p className="notification-timestamp">Received: {new Date(selectedNotification.timestamp).toLocaleString()}</p>
        </Modal>
      )}
    </div>
  );
};

export default Notifications;
