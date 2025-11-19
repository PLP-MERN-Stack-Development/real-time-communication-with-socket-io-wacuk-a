import React from 'react';

const KenyaHeader = ({ title, subtitle, connectionStatus, username }) => {
  const getConnectionStatusColor = () => {
    switch(connectionStatus) {
      case 'connected': return '#27ae60';
      case 'reconnecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getConnectionStatusText = () => {
    switch(connectionStatus) {
      case 'connected': return '✅ Imekunganishwa';
      case 'reconnecting': return '🔄 Inaunganisha tena...';
      case 'disconnected': return '❌ Haijaunganishwa';
      default: return '⏳ Inaunganisha...';
    }
  };

  return (
    <div className="kenya-header">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h1>🇰🇪 {title}</h1>
          {subtitle && <div className="kenya-subtitle">{subtitle}</div>}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '0.9rem', 
            opacity: 0.9,
            marginBottom: '5px'
          }}>
            {getConnectionStatusText()}
          </div>
          {username && (
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Karibu, <strong>{username}</strong>!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KenyaHeader;
