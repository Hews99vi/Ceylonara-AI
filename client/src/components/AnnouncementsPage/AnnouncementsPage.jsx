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
      
      // Log API URL for debugging
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/announcements`;
      console.log('Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Announcements response status:', response.status);
      console.log('Announcements response headers:', [...response.headers].map(h => `${h[0]}: ${h[1]}`).join(', '));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Announcements received:', data);
        console.log('Number of announcements received:', data.length);
        
        // Only use dummy data if no announcements were found
        if (data.length === 0) {
          console.log('No announcements found in the database - using dummy data for testing');
          // Use dummy data for testing if no real announcements exist
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
          console.log('Setting real announcements data from API');
          setAnnouncements(data);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch announcements:', errorText);
        // Use dummy data on error
        console.log('Using dummy data due to error response');
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
      // Use dummy data on error
      console.log('Using dummy data due to caught exception');
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
      <h1>Factory Announcements</h1>
      <p className="subtitle">Stay updated with important announcements from tea factories</p>
      
      {isLoading ? (
        <div className="loading">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="noAnnouncements">No announcements at this time</div>
      ) : (
        <div className="announcementsContainer">
          {announcements.map((announcement, index) => (
            <div key={index} className="announcementCard">
              <div className="announcementHeader">
                <h2>{announcement.factoryName}</h2>
                <div className="announcementDate">{formatDate(announcement.date)}</div>
              </div>
              <div className="announcementContent">
                <p>{announcement.message || announcement.announcement}</p>
                {announcement.image && (
                  <div className="announcementImage">
                    <img src={announcement.image} alt="Announcement" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage; 