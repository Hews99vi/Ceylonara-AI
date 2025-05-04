import React from 'react';
import './DirectChatMessage.css';

const DirectChatMessage = ({ message, isCurrentUser, senderName, formatTime }) => {
  const senderInitial = senderName.charAt(0).toUpperCase();
  
  if (isCurrentUser) {
    // MY MESSAGE
    return (
      <div style={{
        width: '100%', 
        marginBottom: '15px',
        overflow: 'hidden'
      }}>
        <div style={{
          float: 'right',
          display: 'flex',
          flexDirection: 'row-reverse',
          maxWidth: '80%'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#85aa9b',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            marginLeft: '8px'
          }}>
            {senderInitial}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <div style={{fontSize: '12px', marginBottom: '4px', color: '#666'}}>You</div>
            <div style={{
              backgroundColor: '#588b76',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '18px',
              borderBottomRightRadius: '4px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              maxWidth: '100%'
            }}>
              {message.text}
            </div>
            <div style={{fontSize: '11px', marginTop: '4px', color: '#888'}}>
              {formatTime(message.timestamp || message.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // OTHER USER'S MESSAGE
    return (
      <div style={{
        width: '100%', 
        marginBottom: '15px',
        overflow: 'hidden'
      }}>
        <div style={{
          float: 'left',
          display: 'flex',
          flexDirection: 'row',
          maxWidth: '80%'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#588b76',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            marginRight: '8px'
          }}>
            {senderInitial}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}>
            <div style={{fontSize: '12px', marginBottom: '4px', color: '#666'}}>{senderName}</div>
            <div style={{
              backgroundColor: 'white',
              color: '#333',
              padding: '12px 16px',
              borderRadius: '18px',
              borderBottomLeftRadius: '4px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              border: '1px solid #eee',
              maxWidth: '100%'
            }}>
              {message.text}
            </div>
            <div style={{fontSize: '11px', marginTop: '4px', color: '#888'}}>
              {formatTime(message.timestamp || message.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default DirectChatMessage;
