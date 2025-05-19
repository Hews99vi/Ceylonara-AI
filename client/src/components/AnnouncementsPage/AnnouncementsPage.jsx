import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './announcementsPage.css';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();
  
  useEffect(() => {
    console.log('AnnouncementsPage component mounted');
    fetchAnnouncements();
  }, []);
  
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      console.log('Fetching announcements for farmers - token obtained');
      
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/announcements`;
      console.log('Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Announcements response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Announcements received:', data);
        
        if (data.length === 0) {
          setAnnouncements([
            { 
              factoryName: 'Athukorala Tea Factory', 
              message: 'We are increasing our tea leaf collection capacity this month. Please prepare for increased collection volumes.', 
              date: new Date().toISOString(),
              image: null
            },
            { 
              factoryName: 'Nuwara Eliya Tea Factory', 
              message: 'We will be closed for maintenance on November 20-21. Please plan your collections accordingly.', 
              date: new Date(Date.now() - 86400000 * 3).toISOString(),
              image: null
            },
            { 
              factoryName: 'Dimbula Valley Tea', 
              message: 'New premium rates for high-quality tea leaves have been announced. See our price list for details.', 
              date: new Date(Date.now() - 86400000 * 7).toISOString(),
              image: null
            }
          ]);
        } else {
          setAnnouncements(data);
        }
      } else {
        console.error('Failed to fetch announcements');
        setAnnouncements([
          { 
            factoryName: 'Athukorala Tea Factory', 
            message: 'We are increasing our tea leaf collection capacity this month. Please prepare for increased collection volumes.', 
            date: new Date().toISOString(),
            image: null
          },
          { 
            factoryName: 'Nuwara Eliya Tea Factory', 
            message: 'We will be closed for maintenance on November 20-21. Please plan your collections accordingly.', 
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            image: null
          },
          { 
            factoryName: 'Dimbula Valley Tea', 
            message: 'New premium rates for high-quality tea leaves have been announced. See our price list for details.', 
            date: new Date(Date.now() - 86400000 * 7).toISOString(),
            image: null
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([
        { 
          factoryName: 'Athukorala Tea Factory', 
          message: 'We are increasing our tea leaf collection capacity this month. Please prepare for increased collection volumes.', 
          date: new Date().toISOString(),
          image: null
        },
        { 
          factoryName: 'Nuwara Eliya Tea Factory', 
          message: 'We will be closed for maintenance on November 20-21. Please plan your collections accordingly.', 
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          image: null
        },
        { 
          factoryName: 'Dimbula Valley Tea', 
          message: 'New premium rates for high-quality tea leaves have been announced. See our price list for details.', 
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
          image: null
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="announcementsPage">
      <div className="announcements-header">
        <div className="header-content">
          <h1>Factory Announcements</h1>
          <p className="subtitle">Stay updated with important announcements from tea factories</p>
        </div>
      </div>

      <div className="announcements-content">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="noAnnouncements">No announcements at this time</div>
        ) : (
          <div className="announcementsContainer">
            {announcements.map((announcement, index) => {
              const hasValidImage = announcement.image && 
                (announcement.image.startsWith('data:image/') || 
                 announcement.image.startsWith('http'));
              
              return (
                <div key={index} className={`announcementCard ${hasValidImage ? 'hasImage' : 'noImage'}`}>
                  <div className="card-header">
                    <div className="factory-name">{announcement.factoryName}</div>
                  </div>

                  {hasValidImage && (
                    <div className="announcement-image">
                      <img 
                        src={announcement.image} 
                        alt={`${announcement.factoryName} announcement`}
                        onError={(e) => {
                          console.error(`Error loading image for announcement ${index}`);
                          e.target.style.display = 'none';
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="announcement-details">
                    <div className="announcement-content">
                      <p>{announcement.message || announcement.announcement}</p>
                    </div>
                    <div className="announcement-meta">
                      <div className="updateDate">Posted: {formatDate(announcement.date)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage; 