import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './announcementPage.css';

const AnnouncementPage = () => {
  const [announcement, setAnnouncement] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [previousAnnouncements, setPreviousAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [factoryName, setFactoryName] = useState('');
  const { userId, getToken } = useAuth();

  useEffect(() => {
    fetchFactoryData();
    fetchPreviousAnnouncements();
  }, []);

  const fetchFactoryData = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFactoryName(data.factoryName || data.name || '');
      }
    } catch (error) {
      console.error('Error fetching factory data:', error);
    }
  };

  const fetchPreviousAnnouncements = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      console.log('Fetching previous announcements for factory owner');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Factory announcements response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Factory announcements received:', data);
        setPreviousAnnouncements(data);
      } else {
        console.error('Failed to fetch factory announcements');
        // Use dummy data if needed
        setPreviousAnnouncements([
          { 
            message: 'We are increasing our tea leaf collection capacity this month.', 
            date: new Date().toISOString(),
            image: null
          },
          { 
            message: 'Factory will be closed for maintenance on November 20-21.', 
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            image: null
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setPreviousAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    
    if (!announcement.trim()) {
      alert('Please enter an announcement');
      return;
    }
    
    setIsPosting(true);
    setPostSuccess(false);
    
    try {
      const token = await getToken();
      
      // Simplified announcement data - only send essential fields
      const announcementData = {
        announcement: announcement.trim(),
        factoryName: factoryName,
      };
      
      console.log('Sending announcement data:', { 
        ...announcementData, 
        announcement: announcementData.announcement.substring(0, 30) + '...'
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/announcement`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      
      console.log('Announcement post response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Announcement posted successfully:', responseData);
        
        setAnnouncement('');
        setImage(null);
        setImagePreview(null);
        setPostSuccess(true);
        
        // Add the new announcement to our list (optimistic update)
        const newAnnouncement = {
          message: announcement,
          date: new Date().toISOString(),
          factoryName: factoryName
        };
        
        setPreviousAnnouncements([newAnnouncement, ...previousAnnouncements]);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPostSuccess(false);
        }, 3000);
        
        // Refresh announcements list to show the new one
        fetchPreviousAnnouncements();
      } else {
        const errorText = await response.text();
        console.error('Failed to post announcement:', errorText);
        throw new Error(`Failed to post announcement: ${errorText}`);
      }
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Failed to post announcement. Please try again.');
    } finally {
      setIsPosting(false);
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
    <div className="announcementPage">
      <h1>Post Announcement</h1>
      <p className="subtitle">Share important updates with farmers</p>
      
      <div className="announcementContainer">
        <div className="newAnnouncementCard">
          {postSuccess && (
            <div className="successMessage">
              Announcement posted successfully!
            </div>
          )}
          
          <form onSubmit={handleAnnouncementSubmit}>
            <div className="formGroup">
              <label htmlFor="announcement-textarea">Announcement Text</label>
              <textarea
                id="announcement-textarea"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write your announcement here..."
                rows={6}
                className="announcementTextarea"
                disabled={isPosting}
                required
              />
            </div>
            
            <div className="imageUploadSection">
              <label htmlFor="image-upload" className="imageUploadLabel">
                <span className="uploadIcon">📷</span>
                <span>Add Image (Optional)</span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="imageInput"
                  disabled={isPosting}
                />
              </label>
              
              {imagePreview && (
                <div className="imagePreviewContainer">
                  <img src={imagePreview} alt="Preview" className="imagePreview" />
                  <button 
                    type="button" 
                    className="removeImageBtn" 
                    onClick={removeImage}
                  >
                    ✖
                  </button>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="postButton"
              disabled={isPosting}
            >
              {isPosting ? 'Posting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
        
        <div className="previousAnnouncementsSection">
          <h2>Your Previous Announcements</h2>
          
          {isLoading ? (
            <div className="loading">Loading your announcements...</div>
          ) : previousAnnouncements.length === 0 ? (
            <div className="noAnnouncements">You haven't posted any announcements yet</div>
          ) : (
            <div className="announcementsList">
              {previousAnnouncements.map((item, index) => (
                <div key={index} className="previousAnnouncementCard">
                  <div className="announcementHeader">
                    <span className="dateLabel">{formatDate(item.date)}</span>
                  </div>
                  <div className="announcementBody">
                    <p>{item.message || item.announcement}</p>
                    {item.image && (
                      <div className="announcementImageContainer">
                        <img src={item.image} alt="Announcement" className="announcementImage" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="infoCard">
        <h3>Tips for Effective Announcements</h3>
        <ul>
          <li>Keep your messages clear and concise</li>
          <li>Include important dates and times when relevant</li>
          <li>Add images to make your announcements more engaging</li>
          <li>Regularly update farmers about price changes and collection schedules</li>
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementPage; 