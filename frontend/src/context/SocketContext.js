/**
 * Socket Context
 * Manages Socket.io connection for real-time chat
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Create socket connection
    socketRef.current = io(
      process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
      {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('userOnline', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('userOffline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('messageNotification', (data) => {
      setNotifications(prev => [data, ...prev.slice(0, 9)]);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('joinConversation', conversationId);
  };

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('leaveConversation', conversationId);
  };

  const sendMessage = (conversationId, content) => {
    socketRef.current?.emit('sendMessage', { conversationId, content });
  };

  const sendTyping = (conversationId, isTyping) => {
    socketRef.current?.emit('typing', { conversationId, isTyping });
  };

  const markRead = (conversationId) => {
    socketRef.current?.emit('markRead', conversationId);
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      notifications,
      joinConversation,
      leaveConversation,
      sendMessage,
      sendTyping,
      markRead,
      clearNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
