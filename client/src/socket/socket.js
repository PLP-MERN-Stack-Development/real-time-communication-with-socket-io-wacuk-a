// socket.js - Socket.io client setup

import { io } from "socket.io-client";
import { useEffect, useState } from "react";

// Socket.io connection URL - fixed for Create React App
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

// Create socket instance with enhanced configuration
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'] // Fallback support
});

// Available reaction types with emojis
export const REACTION_TYPES = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messageHistory, setMessageHistory] = useState(new Map()); // Room -> messages
  const [hasMoreMessages, setHasMoreMessages] = useState(new Map()); // Room -> boolean

  // Connect to socket server
  const connect = (username, room = 'general') => {
    console.log("🚀 Emitting user_join event with username:", username, "room:", room);
    if (username) {
      socket.emit("user_join", { username, room });
      setCurrentRoom(room);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a public message
  const sendMessage = (messageData) => {
    console.log("📤 Sending public message:", messageData);
    socket.emit("send_message", messageData);
  };

  // Send a file message
  const sendFileMessage = (fileData) => {
    console.log("📁 Sending file message:", fileData);
    socket.emit("send_file_message", fileData);
  };

  // Send a private message
  const sendPrivateMessage = (to, message, from) => {
    console.log("🔒 Sending private message to:", to, "content:", message);
    socket.emit("private_message", { to, message });
  };

  // Add reaction to message
  const addReaction = (messageId, reactionType) => {
    console.log("🎭 Adding reaction:", reactionType, "to message:", messageId);
    socket.emit("add_reaction", { messageId, reactionType });
  };

  // Remove reaction from message
  const removeReaction = (messageId, reactionType) => {
    console.log("🎭 Removing reaction:", reactionType, "from message:", messageId);
    socket.emit("remove_reaction", { messageId, reactionType });
  };

  // Mark message as read
  const markMessageRead = (messageId) => {
    console.log("👀 Marking message as read:", messageId);
    socket.emit("mark_message_read", { messageId });
  };

  // Mark all messages as read in room
  const markAllMessagesRead = (room) => {
    console.log("👀 Marking all messages as read in room:", room);
    socket.emit("mark_all_read", { room });
  };

  // Mark private message as read
  const markPrivateMessageRead = (messageId, fromUser) => {
    console.log("👀 Marking private message as read:", messageId, "from:", fromUser);
    socket.emit("mark_private_message_read", { messageId, fromUser });
  };

  // Change room
  const changeRoom = (newRoom) => {
    console.log("🔄 Changing room to:", newRoom);
    socket.emit("change_room", { newRoom });
    setCurrentRoom(newRoom);
    // Don't clear messages - they're stored per room now
  };

  // Create new room
  const createRoom = (roomName) => {
    console.log("🏗️ Creating new room:", roomName);
    socket.emit("create_room", roomName);
  };

  // Load more messages (pagination)
  const loadMoreMessages = async (room, page = 1) => {
    console.log("📚 Loading more messages for room:", room, "page:", page);
    
    try {
      const response = await fetch(`http://localhost:5000/messages/${room}?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading more messages:', error);
      throw error;
    }
  };

  // Load more messages via socket (alternative method)
  const loadMoreMessagesSocket = (room, page = 1) => {
    console.log("📚 Loading more messages via socket for room:", room, "page:", page);
    socket.emit("load_more_messages", { room, page, limit: 20 });
  };

  // Set typing status
  const setTyping = (isTyping, room = currentRoom) => {
    socket.emit("typing", { isTyping, room });
  };

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const fileInfo = await response.json();
      return fileInfo;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Update message reactions
  const updateMessageReactions = (messageId, newReactions) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, reactions: newReactions } : msg
    ));
  };

  // Update message read receipts
  const updateMessageReadReceipts = (messageId, readBy) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, readBy } : msg
    ));
  };

  // Update private message read status
  const updatePrivateMessageReadStatus = (messageId, readBy) => {
    setPrivateMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true, readBy } : msg
    ));
  };

  // Add messages to history for a room
  const addMessagesToHistory = (room, newMessages) => {
    setMessageHistory(prev => {
      const newHistory = new Map(prev);
      const existingMessages = newHistory.get(room) || [];
      const messageIds = new Set(existingMessages.map(m => m.id));
      
      // Filter out duplicates and add new messages
      const uniqueNewMessages = newMessages.filter(msg => !messageIds.has(msg.id));
      newHistory.set(room, [...existingMessages, ...uniqueNewMessages]);
      
      return newHistory;
    });
  };

  // Socket event listeners
  useEffect(() => {
    const onConnect = () => {
      console.log("✅ Connected to server, socket ID:", socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
    };

    const onDisconnect = (reason) => {
      console.log("❌ Disconnected from server. Reason:", reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need to manually reconnect
        socket.connect();
      }
    };

    const onConnectError = (error) => {
      console.log("🔌 Connection error:", error);
      setConnectionError(error.message);
      setIsReconnecting(false);
    };

    const onReconnect = (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
    };

    const onReconnectAttempt = (attemptNumber) => {
      console.log("🔄 Reconnection attempt:", attemptNumber);
      setIsReconnecting(true);
    };

    const onReconnectError = (error) => {
      console.log("🔄 Reconnection error:", error);
      setConnectionError(error.message);
    };

    const onReconnectFailed = () => {
      console.log("🔄 Reconnection failed");
      setIsReconnecting(false);
      setConnectionError('Failed to reconnect to server');
    };

    const onReceiveMessage = (message) => {
      console.log("📨 Received message for room:", message.room, "content:", message);
      
      // Add to current messages if it's for the current room
      if (!message.room || message.room === currentRoom || message.system) {
        setLastMessage(message);
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(msg => msg.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      // Always add to message history
      if (message.room) {
        addMessagesToHistory(message.room, [message]);
      }
    };

    const onPrivateMessage = (message) => {
      console.log("🔒 Received private message:", message);
      setPrivateMessages((prev) => {
        // Prevent duplicates
        if (prev.some(msg => msg.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const onPrivateMessageError = (error) => {
      console.log("❌ Private message error:", error);
      alert(`Error: ${error.error}`);
    };

    const onUserList = (userList) => {
      console.log("👥 User list updated:", userList);
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      console.log("🟢 User joined:", user);
      if (user.room === currentRoom) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            system: true,
            message: user.username + " joined the room",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    const onUserLeft = (user) => {
      console.log("🔴 User left:", user);
      if (user.room === currentRoom) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            system: true,
            message: user.username + " left the room",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    const onTypingUsers = (users) => {
      console.log("⌨️ Typing users:", users);
      setTypingUsers(users);
    };

    const onRoomList = (roomList) => {
      console.log("🏠 Room list updated:", roomList);
      setRooms(roomList);
    };

    const onRoomChanged = (data) => {
      console.log("🔄 Room changed:", data);
      setCurrentRoom(data.newRoom);
      
      // Load messages for the new room from history
      const roomMessages = messageHistory.get(data.newRoom) || [];
      setMessages(roomMessages.slice(-50)); // Show last 50 messages
    };

    const onRoomCreated = (roomName) => {
      console.log("🏗️ New room created:", roomName);
      setRooms(prev => [...prev, roomName]);
    };

    const onReactionUpdated = (data) => {
      console.log("🎭 Reaction updated:", data);
      updateMessageReactions(data.messageId, data.reactions);
    };

    const onReactionError = (error) => {
      console.log("❌ Reaction error:", error);
      alert(`Reaction error: ${error.error}`);
    };

    const onReadReceiptUpdated = (data) => {
      console.log("👀 Read receipt updated:", data);
      updateMessageReadReceipts(data.messageId, data.readBy);
    };

    const onAllMessagesRead = (data) => {
      console.log("👀 All messages read in room:", data);
      setMessages(prev => prev.map(msg => 
        msg.room === data.room && msg.readBy && !msg.readBy.includes(data.username)
          ? { ...msg, readBy: [...msg.readBy, data.username] }
          : msg
      ));
    };

    const onPrivateMessageRead = (data) => {
      console.log("👀 Private message read:", data);
      updatePrivateMessageReadStatus(data.messageId, data.readBy);
    };

    const onMoreMessagesLoaded = (data) => {
      console.log("📚 More messages loaded:", data);
      if (data.room === currentRoom) {
        // Add older messages to the beginning
        setMessages(prev => [...data.messages, ...prev]);
        setHasMoreMessages(prev => new Map(prev).set(data.room, data.hasMore));
      }
    };

    // Register event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect", onReconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("reconnect_error", onReconnectError);
    socket.on("reconnect_failed", onReconnectFailed);
    socket.on("receive_message", onReceiveMessage);
    socket.on("private_message", onPrivateMessage);
    socket.on("private_message_error", onPrivateMessageError);
    socket.on("user_list", onUserList);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("typing_users", onTypingUsers);
    socket.on("room_list", onRoomList);
    socket.on("room_changed", onRoomChanged);
    socket.on("room_created", onRoomCreated);
    socket.on("reaction_updated", onReactionUpdated);
    socket.on("reaction_error", onReactionError);
    socket.on("read_receipt_updated", onReadReceiptUpdated);
    socket.on("all_messages_read", onAllMessagesRead);
    socket.on("private_message_read", onPrivateMessageRead);
    socket.on("more_messages_loaded", onMoreMessagesLoaded);

    // Initial connection check
    console.log("🔍 Initial socket state - connected:", socket.connected, "id:", socket.id);

    // Clean up event listeners
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reconnect", onReconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("reconnect_error", onReconnectError);
      socket.off("reconnect_failed", onReconnectFailed);
      socket.off("receive_message", onReceiveMessage);
      socket.off("private_message", onPrivateMessage);
      socket.off("private_message_error", onPrivateMessageError);
      socket.off("user_list", onUserList);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("typing_users", onTypingUsers);
      socket.off("room_list", onRoomList);
      socket.off("room_changed", onRoomChanged);
      socket.off("room_created", onRoomCreated);
      socket.off("reaction_updated", onReactionUpdated);
      socket.off("reaction_error", onReactionError);
      socket.off("read_receipt_updated", onReadReceiptUpdated);
      socket.off("all_messages_read", onAllMessagesRead);
      socket.off("private_message_read", onPrivateMessageRead);
      socket.off("more_messages_loaded", onMoreMessagesLoaded);
    };
  }, [currentRoom]);

  return {
    socket,
    isConnected,
    isReconnecting,
    connectionError,
    lastMessage,
    messages,
    privateMessages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    messageHistory,
    hasMoreMessages,
    connect,
    disconnect,
    sendMessage,
    sendFileMessage,
    sendPrivateMessage,
    addReaction,
    removeReaction,
    markMessageRead,
    markAllMessagesRead,
    markPrivateMessageRead,
    changeRoom,
    createRoom,
    loadMoreMessages,
    loadMoreMessagesSocket,
    uploadFile,
    setTyping,
  };
};
