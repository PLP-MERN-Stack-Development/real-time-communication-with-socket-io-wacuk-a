import React from 'react';

const KenyaRoomList = ({ 
  rooms, 
  currentRoom, 
  onRoomChange, 
  unreadCounts,
  onCreateRoom 
}) => {
  const getRoomIcon = (roomName) => {
    const roomIcons = {
      'general': '🏠',
      'nairobi': '🏙️',
      'mombasa': '🏖️',
      'kisumu': '🌅',
      'nakuru': '🦩',
      'eldoret': '🏔️',
      'tech': '💻',
      'sports': '⚽',
      'business': '💼',
      'education': '🎓'
    };
    
    return roomIcons[roomName.toLowerCase()] || '💬';
  };

  const getRoomDisplayName = (roomName) => {
    const displayNames = {
      'general': 'Jumuiya Kuu',
      'nairobi': 'Nairobi',
      'mombasa': 'Mombasa',
      'kisumu': 'Kisumu',
      'nakuru': 'Nakuru',
      'eldoret': 'Eldoret',
      'tech': 'Tekinolojia',
      'sports': 'Michezo',
      'business': 'Biashara',
      'education': 'Elimu'
    };
    
    return displayNames[roomName.toLowerCase()] || roomName;
  };

  return (
    <div className="kenya-card">
      <div className="kenya-card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Vyumba vya Mazungumzo</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {rooms.length} vyumba
          </span>
        </div>
      </div>
      
      <div style={{ padding: '15px', maxHeight: '300px', overflowY: 'auto' }}>
        {rooms.map((room, index) => (
          <div
            key={index}
            className={`room-item ${currentRoom === room ? 'active' : ''}`}
            onClick={() => onRoomChange(room)}
          >
            <span className="room-icon">{getRoomIcon(room)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>
                {getRoomDisplayName(room)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                #{room}
              </div>
            </div>
            {unreadCounts[room] > 0 && room !== currentRoom && (
              <div className="notification-badge">
                {unreadCounts[room]}
              </div>
            )}
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontStyle: 'italic',
            padding: '20px'
          }}>
            Inapakia vyumba...
          </div>
        )}
      </div>
    </div>
  );
};

export default KenyaRoomList;
