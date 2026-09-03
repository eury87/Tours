import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Booking, NotificationItem } from '../types';
import { playNotificationChime } from '../utils/audio';

interface InAppAlert {
  type: string;
  title: string;
  message: string;
  booking?: Booking;
  timestamp: string;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  liveBookings: Booking[];
  notifications: NotificationItem[];
  unreadCount: number;
  latestAlert: InAppAlert | null;
  dismissLatestAlert: () => void;
  markNotificationsAsRead: () => void;
  refreshBookings: () => Promise<void>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAlert, setLatestAlert] = useState<InAppAlert | null>(null);

  const fetchInitialData = async () => {
    try {
      const [resBookings, resNotifs] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/notifications')
      ]);

      if (resBookings.ok) {
        const data = await resBookings.json();
        setLiveBookings(data.data || []);
      }
      if (resNotifs.ok) {
        const notifData = await resNotifs.json();
        setNotifications(notifData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching initial socket context data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Conectado a WebSockets');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado de WebSockets');
      setConnected(false);
    });

    newSocket.on('booking:created', (booking: Booking) => {
      console.log('🔔 Nueva reserva recibida por WebSocket:', booking.code);
      setLiveBookings((prev) => [booking, ...prev.filter(b => b.id !== booking.id)]);
      setUnreadCount((prev) => prev + 1);
      playNotificationChime();
    });

    newSocket.on('booking:updated', (booking: Booking) => {
      setLiveBookings((prev) => prev.map(b => b.id === booking.id || b.code === booking.code ? booking : b));
    });

    newSocket.on('notification:in_app', (alert: InAppAlert) => {
      setLatestAlert(alert);
      setUnreadCount((prev) => prev + 1);
      playNotificationChime();

      // Auto ocultar el toast flotante a los 8 segundos
      setTimeout(() => {
        setLatestAlert((current) => (current?.timestamp === alert.timestamp ? null : current));
      }, 8000);
    });

    newSocket.on('notifications:updated', (updatedNotifs: NotificationItem[]) => {
      setNotifications(updatedNotifs);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const dismissLatestAlert = () => setLatestAlert(null);

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        liveBookings,
        notifications,
        unreadCount,
        latestAlert,
        dismissLatestAlert,
        markNotificationsAsRead,
        refreshBookings: fetchInitialData,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
