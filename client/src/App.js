import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import './App.css';

// Socket connection (no hooks here)
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Regular function for notification sound (no hooks)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('🔇 Audio context not supported:', error);
  }
};

// React.memo for message component
const Message = React.memo(({ msg, username, messageReactions, addReaction, commonEmojis }) => {
  const handleReaction = useCallback((emoji) => {
    addReaction(msg.id, emoji);
  }, [msg.id, addReaction]);

  return (
    <div className={`message ${msg.sender === username ? 'own-message' : 'other-message'}`}>
      <strong>{msg.sender}:</strong> 
      {msg.isFile ? (
        <div>
          <div>📎 Shared file: {msg.file.name}</div>
          {msg.file.type.startsWith('image/') && (
            <img 
              src={msg.file.data} 
              alt={msg.file.name}
              style={{maxWidth: '200px', maxHeight: '200px', marginTop: '5px', borderRadius: '5px'}}
              loading="lazy"
            />
          )}
          <a 
            href={msg.file.data} 
            download={msg.file.name}
            style={{display: 'block', color: 'var(--kenya-green)', marginTop: '5px'}}
          >
            📥 Download File
          </a>
        </div>
      ) : (
        msg.text
      )}
      <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
      
      {/* Message Reactions */}
      {messageReactions[msg.id] && (
        <div style={{marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
          {Object.entries(
            messageReactions[msg.id].reduce((acc, reaction) => {
              acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
              return acc;
            }, {})
          ).map(([emoji, count]) => (
            <span 
              key={emoji}
              style={{
                background: 'rgba(0,0,0,0.1)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '12px'
              }}
            >
              {emoji} {count}
            </span>
          ))}
        </div>
      )}
      
      {/* Reaction Picker */}
      <div style={{marginTop: '5px', display: 'flex', gap: '2px'}}>
        {commonEmojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
});

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [privateMessage, setPrivateMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState({});
  const [activeRoom, setActiveRoom] = useState('general');
  const [rooms, setRooms] = useState(['general', 'nairobi', 'mombasa', 'kisumu', 'coastal']);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [messageLimit, setMessageLimit] = useState(50);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Performance optimization: Memoize common values
  const commonEmojis = useMemo(() => ['👍', '❤️', '😂', '😮', '😢', '👏'], []);
  const quickMessages = useMemo(() => [
    "Hello everyone! 👋",
    "How is everyone doing? 😊",
    "Good morning! ☀️",
    "Anyone from Nairobi? 🏙️",
    "Kenya to the world! 🇰🇪",
    "Have a great day! 🌟"
  ], []);

  // Track window focus for notifications
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true);
      setUnreadCount(0);
    };
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Enhanced connection handling with reconnection logic
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
      
      // Rejoin room if was previously registered
      if (isRegistered && username) {
        socket.emit('join room', { username, room: activeRoom });
      }
    };

    const handleDisconnect = (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need to manually reconnect
        socket.connect();
      }
    };

    const handleReconnect = (attemptNumber) => {
      console.log(`🔄 Reconnecting... Attempt ${attemptNumber}`);
      setConnectionStatus('reconnecting');
    };

    const handleReconnectError = (error) => {
      console.log('❌ Reconnection error:', error);
      setConnectionStatus('error');
    };

    const handleReconnectFailed = () => {
      console.log('💥 Reconnection failed');
      setConnectionStatus('failed');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      setConnectionStatus('error');
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('connect_error');
    };
  }, [isRegistered, username, activeRoom]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, privateMessages, scrollToBottom]);

  // Show browser notification
  const showBrowserNotification = useCallback((title, body) => {
    if (!notificationsEnabled) return;
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: '/kenya-flag.png',
        badge: '/kenya-flag.png'
      });
    }
  }, [notificationsEnabled]);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // File size limit: 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size too large. Please choose a file smaller than 10MB.');
        return;
      }
      
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  }, []);

  // Send file as message
  const sendFileMessage = useCallback(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        sender: username,
        timestamp: new Date().toISOString(),
        room: activeRoom
      };

      socket.emit('file message', fileData);
      
      const messageData = {
        text: `📎 Shared file: ${file.name}`,
        sender: username,
        timestamp: new Date().toISOString(),
        room: activeRoom,
        file: fileData,
        isFile: true,
        id: Date.now().toString()
      };
      
      setMessages(prev => {
        const newMessages = [...prev, messageData];
        // Keep only the last N messages for performance
        return newMessages.slice(-messageLimit);
      });
      setFile(null);
      setFilePreview(null);
      document.getElementById('file-input').value = '';
    };
    reader.readAsDataURL(file);
  }, [file, username, activeRoom, messageLimit]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { username, room: activeRoom });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop typing', { username, room: activeRoom });
    }, 1000);
  }, [isTyping, username, activeRoom]);

  // Add reaction to message
  const addReaction = useCallback((messageId, emoji) => {
    const reactionData = {
      messageId,
      emoji,
      username,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('message reaction', reactionData);
    
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), reactionData]
    }));
  }, [username]);

  // Message search functionality
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    
    const searchLower = searchTerm.toLowerCase();
    return messages.filter(msg => 
      msg.text.toLowerCase().includes(searchLower) ||
      msg.sender.toLowerCase().includes(searchLower) ||
      (msg.isFile && msg.file.name.toLowerCase().includes(searchLower))
    );
  }, [messages, searchTerm]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    setMessageLimit(prev => prev + 25);
  }, []);

  useEffect(() => {
    const handleNewMessage = (data) => {
      setMessages(prev => {
        const newMessages = [...prev, data];
        // Performance: Keep only the last N messages
        return newMessages.slice(-messageLimit);
      });
      
      // Send read receipt
      if (data.id) {
        socket.emit('message read', { messageId: data.id, username });
      }
      
      // Show notification for new messages from others
      if (data.sender !== username && notificationsEnabled) {
        if (!isWindowFocused || document.hidden) {
          setUnreadCount(prev => prev + 1);
          playNotificationSound(); // Fixed: using the regular function now
          showBrowserNotification(
            `💬 New message from ${data.sender}`,
            data.isFile ? `Shared a file: ${data.file?.name}` : 
            (data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text)
          );
        }
      }
    };

    socket.on('chat message', handleNewMessage);
    socket.on('file message', handleNewMessage);

    socket.on('user joined', (userList) => {
      setUsers(userList);
    });

    socket.on('user left', (userList) => {
      setUsers(userList);
    });

    socket.on('private message', (data) => {
      setPrivateMessages(prev => {
        const key = [data.from, data.to].sort().join('-');
        const updatedMessages = {
          ...prev,
          [key]: [...(prev[key] || []), data]
        };
        
        if (data.from !== username && notificationsEnabled) {
          if (!isWindowFocused || document.hidden || selectedUser !== data.from) {
            setUnreadCount(prev => prev + 1);
            playNotificationSound(); // Fixed: using the regular function now
            showBrowserNotification(
              `🔒 Private message from ${data.from}`,
              data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text
            );
          }
        }
        
        return updatedMessages;
      });
    });

    socket.on('typing', (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user !== data.username);
        return [...filtered, data.username];
      });
    });

    socket.on('stop typing', (data) => {
      setTypingUsers(prev => prev.filter(user => user !== data.username));
    });

    socket.on('message reaction', (reactionData) => {
      setMessageReactions(prev => ({
        ...prev,
        [reactionData.messageId]: [...(prev[reactionData.messageId] || []), reactionData]
      }));
    });

    socket.on('message read', (readData) => {
      setReadReceipts(prev => ({
        ...prev,
        [readData.messageId]: [...(prev[readData.messageId] || []), readData.username]
      }));
    });

    socket.on('room users', (data) => {
      setUsers(data.users);
    });

    return () => {
      socket.off('chat message');
      socket.off('file message');
      socket.off('user joined');
      socket.off('user left');
      socket.off('private message');
      socket.off('typing');
      socket.off('stop typing');
      socket.off('message reaction');
      socket.off('message read');
      socket.off('room users');
    };
  }, [username, notificationsEnabled, isWindowFocused, selectedUser, messageLimit, showBrowserNotification]);

  const handleRegister = useCallback((e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('register', username);
      setIsRegistered(true);
      socket.emit('join room', { username, room: 'general' });
    }
  }, [username]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if ((message.trim() || file) && username) {
      if (file) {
        sendFileMessage();
      } else {
        const messageData = {
          text: message,
          sender: username,
          timestamp: new Date().toISOString(),
          room: activeRoom,
          id: Date.now().toString()
        };
        socket.emit('chat message', messageData);
        setMessage('');
      }
    }
  }, [message, file, username, activeRoom, sendFileMessage]);

  const handleSendPrivateMessage = useCallback((e) => {
    e.preventDefault();
    if (privateMessage.trim() && selectedUser && username) {
      const privateMessageData = {
        to: selectedUser,
        from: username,
        text: privateMessage,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      socket.emit('private message', privateMessageData);
      
      setPrivateMessages(prev => {
        const key = [username, selectedUser].sort().join('-');
        return {
          ...prev,
          [key]: [...(prev[key] || []), privateMessageData]
        };
      });
      setPrivateMessage('');
    }
  }, [privateMessage, selectedUser, username]);

  const startPrivateChat = useCallback((user) => {
    setSelectedUser(user);
    setUnreadCount(0);
  }, []);

  const closePrivateChat = useCallback(() => {
    setSelectedUser(null);
    setPrivateMessage('');
  }, []);

  const joinRoom = useCallback((room) => {
    socket.emit('join room', { username, room });
    setActiveRoom(room);
    setMessages([]);
    setUnreadCount(0);
    setTypingUsers([]);
    setSearchTerm(''); // Clear search when changing rooms
  }, [username]);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(!notificationsEnabled);
    if (!notificationsEnabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  const sendQuickMessage = useCallback((msg) => {
    setMessage(msg);
  }, []);

  // Get private messages for a specific user
  const getPrivateMessagesWithUser = useCallback((user) => {
    const key = [username, user].sort().join('-');
    return privateMessages[key] || [];
  }, [username, privateMessages]);

  if (!isRegistered) {
    return (
      <div className="App">
        <div className="kenya-pattern"></div>
        <div className="container">
          <div className="register-form floating">
            <h2>🎉 Welcome to Kenya Chat Connect! 🎉</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>
              Connect with Kenyans from around the world in real-time!
            </p>
            
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '5px',
              textAlign: 'center',
              backgroundColor: 
                connectionStatus === 'connected' ? '#d4edda' :
                connectionStatus === 'error' ? '#f8d7da' : '#fff3cd',
              color: 
                connectionStatus === 'connected' ? '#155724' :
                connectionStatus === 'error' ? '#721c24' : '#856404',
              border: '1px solid'
            }}>
              Status: {connectionStatus.toUpperCase()}
            </div>

            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Choose your username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="kenya-input"
              />
              <button 
                type="submit" 
                className="kenya-button" 
                style={{width: '100%', marginTop: '15px'}}
                disabled={connectionStatus !== 'connected'}
              >
                {connectionStatus === 'connected' ? '🔐 Join Chat' : 'Connecting...'}
              </button>
            </form>
            <div style={{marginTop: '20px', fontSize: '0.9rem', color: '#888'}}>
              <strong>💡 Did you know:</strong> Connecting Kenyans worldwide!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="kenya-pattern"></div>
      
      <header className="app-header">
        <div className="container">
          <h1>🇰🇪 Kenya Chat Connect 🇰🇪</h1>
          <h2>Complete Real-Time Chat with Advanced Performance & UX!</h2>
        </div>
      </header>

      <div className="container">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
          <div>
            <h3 style={{color: 'var(--kenya-green)', margin: 0}}>
              Welcome, <strong>{username}</strong>! 👋
            </h3>
            <p style={{color: '#666', margin: 0}}>
              Active room: <strong>{activeRoom}</strong>
              {selectedUser && ` | Private chat with: ${selectedUser}`}
            </p>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
            {/* Search Toggle */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="kenya-button"
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                background: showSearch ? 
                  'linear-gradient(45deg, var(--kenya-red), var(--kenya-black))' : 
                  'linear-gradient(45deg, var(--kenya-green), var(--kenya-black))'
              }}
              title="Search messages"
            >
              🔍
            </button>
            
            <button 
              onClick={toggleNotifications}
              className="kenya-button"
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                background: notificationsEnabled ? 
                  'linear-gradient(45deg, var(--kenya-green), var(--kenya-black))' : 
                  'linear-gradient(45deg, #666, #999)'
              }}
            >
              {notificationsEnabled ? '🔔' : '🔕'}
            </button>
            
            {unreadCount > 0 && (
              <div style={{
                background: 'var(--kenya-red)',
                color: 'white',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </div>
            )}
            
            <div className="kenya-button" style={{padding: '10px 20px'}}>
              Online: {users.length} | {connectionStatus}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            borderRadius: '10px',
            border: '2px solid var(--kenya-gold)'
          }}>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <input
                type="text"
                placeholder="Search messages, users, or files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="kenya-input"
                style={{flex: 1}}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="kenya-button"
                  style={{background: 'var(--kenya-red)'}}
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div style={{marginTop: '10px', color: '#666', fontSize: '0.9rem'}}>
                Found {filteredMessages.length} messages matching "{searchTerm}"
              </div>
            )}
          </div>
        )}

        <div className="chat-container">
          <div className="online-users">
            <h3>👥 Online Users ({users.length - 1})</h3>
            <div className="users-list">
              {users.filter(user => user !== username).map((user, index) => (
                <div 
                  key={index} 
                  className={`user-item ${selectedUser === user ? 'selected' : ''}`}
                  onClick={() => startPrivateChat(user)}
                  style={{cursor: 'pointer'}}
                >
                  <span style={{marginRight: '8px'}}>
                    {selectedUser === user ? '💬' : '🟢'}
                  </span>
                  {user}
                  {getPrivateMessagesWithUser(user).length > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--kenya-red)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getPrivateMessagesWithUser(user).length}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <h3 style={{marginTop: '30px', marginBottom: '15px'}}>🏠 Chat Rooms</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {rooms.map(room => (
                <button
                  key={room}
                  onClick={() => joinRoom(room)}
                  className={`kenya-button ${activeRoom === room ? '' : 'secondary'}`}
                  style={{
                    background: activeRoom === room ? 
                      'linear-gradient(45deg, var(--kenya-red), var(--kenya-black))' : 
                      'linear-gradient(45deg, #666, #999)',
                    padding: '10px 15px',
                    fontSize: '14px'
                  }}
                >
                  {room === 'general' && '🌍 '}
                  {room === 'nairobi' && '🏙️ '}
                  {room === 'mombasa' && '🏖️ '}
                  {room === 'kisumu' && '🐟 '}
                  {room === 'coastal' && '🌊 '}
                  {room.charAt(0).toUpperCase() + room.slice(1)}
                </button>
              ))}
            </div>

            <h3 style={{marginTop: '30px', marginBottom: '15px'}}>💬 Quick Messages</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => sendQuickMessage(msg)}
                  className="kenya-button"
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    background: 'linear-gradient(45deg, var(--kenya-gold), var(--kenya-sun))',
                    color: 'var(--kenya-black)'
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <div className="main-chat">
            {selectedUser && (
              <div className="private-chat-section">
                <div className="private-chat-header">
                  <h3>💬 Private Chat with {selectedUser}</h3>
                  <button 
                    onClick={closePrivateChat}
                    className="close-button"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="private-messages">
                  {getPrivateMessagesWithUser(selectedUser).length === 0 ? (
                    <div style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    getPrivateMessagesWithUser(selectedUser).map((msg, index) => (
                      <Message
                        key={index}
                        msg={msg}
                        username={username}
                        messageReactions={messageReactions}
                        addReaction={addReaction}
                        commonEmojis={commonEmojis}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendPrivateMessage} className="private-message-form">
                  <input
                    type="text"
                    placeholder={`Type a private message for ${selectedUser}...`}
                    value={privateMessage}
                    onChange={(e) => setPrivateMessage(e.target.value)}
                    onKeyDown={handleTyping}
                    className="kenya-input"
                  />
                  <button type="submit" className="kenya-button">
                    📤 Send
                  </button>
                </form>
              </div>
            )}

            <div className="chat-messages">
              {filteredMessages.length === 0 ? (
                <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
                  {searchTerm ? (
                    <>
                      <h3>🔍 No messages found</h3>
                      <p>No messages match your search for "{searchTerm}"</p>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="kenya-button"
                        style={{marginTop: '10px'}}
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>🎉 Welcome to the {activeRoom} room!</h3>
                      <p>Start a conversation by typing a message below...</p>
                      <div style={{marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center'}}>
                        {quickMessages.map((msg, index) => (
                          <button
                            key={index}
                            onClick={() => sendQuickMessage(msg)}
                            className="kenya-button"
                            style={{padding: '8px 15px', fontSize: '12px'}}
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Load More Messages Button */}
                  {messages.length > filteredMessages.length && !searchTerm && (
                    <div style={{textAlign: 'center', padding: '10px'}}>
                      <button 
                        onClick={loadMoreMessages}
                        className="kenya-button"
                        style={{fontSize: '12px', padding: '5px 15px'}}
                      >
                        📜 Load More Messages
                      </button>
                    </div>
                  )}
                  
                  {filteredMessages.map((msg, index) => (
                    <Message
                      key={msg.id || index}
                      msg={msg}
                      username={username}
                      messageReactions={messageReactions}
                      addReaction={addReaction}
                      commonEmojis={commonEmojis}
                    />
                  ))}
                </>
              )}
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div style={{padding: '10px', color: '#666', fontStyle: 'italic'}}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {filePreview && (
              <div style={{
                padding: '10px',
                marginBottom: '10px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '2px dashed var(--kenya-gold)'
              }}>
                <p><strong>File Preview:</strong> {file.name}</p>
                {file.type.startsWith('image/') && (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={{maxWidth: '100px', maxHeight: '100px', borderRadius: '5px'}}
                    loading="lazy"
                  />
                )}
                <button 
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                    document.getElementById('file-input').value = '';
                  }}
                  style={{
                    background: 'var(--kenya-red)',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    marginLeft: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="message-form">
              <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  className="kenya-input"
                  style={{flex: 1}}
                />
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  style={{display: 'none'}}
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('file-input').click()}
                  className="kenya-button"
                  style={{background: 'linear-gradient(45deg, var(--kenya-gold), var(--kenya-sun))'}}
                  title="Attach file"
                >
                  📎
                </button>
                <button type="submit" className="kenya-button">
                  {file ? '📤 Send File' : '📨 Send'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style={{textAlign: 'center', marginTop: '30px', padding: '20px', borderTop: '2px dashed var(--kenya-gold)', color: '#666'}}>
          <p>
            <strong>🇰🇪 Kenya Chat Connect - ALL TASKS COMPLETE!</strong>
            <br />
            <small>
              ✅ TASK 1-5: Full Stack Real-Time Chat • Performance Optimized • Mobile Ready
            </small>
          </p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', fontSize: '1.5rem'}}>
            <span title="Real-time Chat">💬</span>
            <span title="File Sharing">📎</span>
            <span title="Search">🔍</span>
            <span title="Performance">⚡</span>
            <span title="Kenya Pride">🇰🇪</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
