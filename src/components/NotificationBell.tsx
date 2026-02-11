import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Bell } from 'lucide-react';
import './NotificationBell.css';

interface NotificationBellProps {
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0); // Start at 0, fetch real data

  // Fetch notifications for learners
  useEffect(() => {
    if (user && user?.user_metadata?.role === 'learner') {
      // Use real data fetching from Supabase
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotificationCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="notification-bell"
    >
      <span className="notification-text">
        NOTIFICATIONS
      </span>
      
      {notificationCount > 0 && (
        <div className="notification-icon-wrapper">
          <Bell className="notification-bell-icon" size={16} />
          <span className="notification-badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;