import React from 'react';

// This is a completely new component without any dependencies
const ChatMessageFix = ({ message, isCurrentUser, senderName, formatTime }) => {
  const senderInitial = senderName.charAt(0).toUpperCase();

  if (isCurrentUser) {
    // User's own message
    return (
      <table width="100%" border="0" cellPadding="0" cellSpacing="0" style={{marginBottom: '15px', borderCollapse: 'collapse'}}>
        <tbody>
          <tr>
            <td align="right" style={{verticalAlign: 'top'}}>
              <table width="auto" border="0" cellPadding="0" cellSpacing="0" style={{maxWidth: '80%', marginLeft: 'auto', marginRight: '8px'}}>
                <tbody>
                  <tr>
                    <td align="right" style={{verticalAlign: 'top', paddingRight: '8px'}}>
                      <span style={{fontSize: '12px', color: '#666', display: 'block', textAlign: 'right', marginBottom: '4px'}}>You</span>
                      <div style={{
                        backgroundColor: '#588b76',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        borderBottomRightRadius: '4px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        display: 'inline-block',
                        maxWidth: '100%',
                        wordBreak: 'break-word'
                      }}>
                        {message.text}
                      </div>
                      <span style={{fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', display: 'block', textAlign: 'right', marginTop: '4px'}}>
                        {formatTime(message.timestamp || message.createdAt)}
                      </span>
                    </td>
                    <td style={{verticalAlign: 'top'}}>
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
                        fontSize: '14px'
                      }}>
                        {senderInitial}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );
  } else {
    // Other person's message
    return (
      <table width="100%" border="0" cellPadding="0" cellSpacing="0" style={{marginBottom: '15px', borderCollapse: 'collapse'}}>
        <tbody>
          <tr>
            <td align="left" style={{verticalAlign: 'top'}}>
              <table width="auto" border="0" cellPadding="0" cellSpacing="0" style={{maxWidth: '80%', marginRight: 'auto', marginLeft: '8px'}}>
                <tbody>
                  <tr>
                    <td style={{verticalAlign: 'top'}}>
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
                        fontSize: '14px'
                      }}>
                        {senderInitial}
                      </div>
                    </td>
                    <td align="left" style={{verticalAlign: 'top', paddingLeft: '8px'}}>
                      <span style={{fontSize: '12px', color: '#666', display: 'block', textAlign: 'left', marginBottom: '4px'}}>{senderName}</span>
                      <div style={{
                        backgroundColor: 'white',
                        color: '#333',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        borderBottomLeftRadius: '4px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #eee',
                        display: 'inline-block',
                        maxWidth: '100%',
                        wordBreak: 'break-word'
                      }}>
                        {message.text}
                      </div>
                      <span style={{fontSize: '11px', color: '#888', display: 'block', textAlign: 'left', marginTop: '4px'}}>
                        {formatTime(message.timestamp || message.createdAt)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
};

export default ChatMessageFix; 