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
  
  // Add states for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

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
            _id: 'dummy1',
            message: 'We are increasing our tea leaf collection capacity this month.', 
            date: new Date().toISOString(),
            image: null
          },
          { 
            _id: 'dummy2',
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

  // Add function to handle editing an announcement
  const handleEditAnnouncement = (item) => {
    setIsEditing(true);
    setEditingId(item._id);
    setAnnouncement(item.message || item.announcement);
    setImagePreview(item.image);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add function to handle deleting an announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      setIsPosting(true);
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/announcement/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('Announcement deleted successfully');
        setDeleteSuccess(true);
        
        // Remove the deleted announcement from the list
        setPreviousAnnouncements(previousAnnouncements.filter(item => item._id !== id));
        
        // Clear delete success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Failed to delete announcement:', errorText);
        throw new Error(`Failed to delete announcement: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Modify the announcement submit function to handle updates
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    
    if (!announcement.trim()) {
      alert('Please enter an announcement');
      return;
    }
    
    setIsPosting(true);
    setPostSuccess(false);
    setUpdateSuccess(false);
    
    try {
      const token = await getToken();
      
      // Create announcement data with image if available
      const announcementData = {
        announcement: announcement.trim(),
        factoryName: factoryName,
        image: imagePreview // Include the image data URL directly
      };
      
      console.log('Sending announcement data:', { 
        announcement: announcementData.announcement.substring(0, 30) + '...',
        factoryName: announcementData.factoryName,
        hasImage: !!imagePreview
      });
      
      let url = `${import.meta.env.VITE_API_URL}/api/factory/announcement`;
      let method = 'POST';
      
      // If editing, use PUT method and add ID to URL
      if (isEditing && editingId) {
        url = `${url}/${editingId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      
      console.log('Announcement response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Announcement operation successful:', responseData);
        
        setAnnouncement('');
        setImage(null);
        setImagePreview(null);
        
        if (isEditing) {
          setUpdateSuccess(true);
          setIsEditing(false);
          setEditingId(null);
          
          // Clear update success message after 3 seconds
          setTimeout(() => {
            setUpdateSuccess(false);
          }, 3000);
        } else {
          setPostSuccess(true);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setPostSuccess(false);
          }, 3000);
        }
        
        // Refresh announcements list to show the updated list
        fetchPreviousAnnouncements();
      } else {
        const errorText = await response.text();
        console.error(`Failed to ${isEditing ? 'update' : 'post'} announcement:`, errorText);
        throw new Error(`Failed to ${isEditing ? 'update' : 'post'} announcement: ${errorText}`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'posting'} announcement:`, error);
      alert(`Failed to ${isEditing ? 'update' : 'post'} announcement. Please try again.`);
    } finally {
      setIsPosting(false);
    }
  };

  // Add function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingId(null);
    setAnnouncement('');
    setImage(null);
    setImagePreview(null);
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
          
          {updateSuccess && (
            <div className="successMessage">
              Announcement updated successfully!
            </div>
          )}
          
          {deleteSuccess && (
            <div className="successMessage deleteSuccess">
              Announcement deleted successfully!
            </div>
          )}
          
          <form onSubmit={handleAnnouncementSubmit}>
            <div className="formHeader">
              {isEditing ? (
                <h3>Edit Announcement</h3>
              ) : (
                <h3>Create New Announcement</h3>
              )}
            </div>
            
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
            
            <div className="buttonGroup">
              {isEditing && (
                <button 
                  type="button" 
                  className="cancelButton"
                  onClick={cancelEditing}
                  disabled={isPosting}
                >
                  Cancel
                </button>
              )}
              
              <button 
                type="submit" 
                className="postButton"
                disabled={isPosting}
              >
                {isPosting ? 'Processing...' : isEditing ? 'Update Announcement' : 'Post Announcement'}
              </button>
            </div>
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
                    <div className="actionButtons">
                      <button
                        type="button"
                        className="editButton"
                        onClick={() => handleEditAnnouncement(item)}
                        title="Edit announcement"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="deleteButton"
                        onClick={() => handleDeleteAnnouncement(item._id)}
                        title="Delete announcement"
                      >
                        🗑️
                      </button>
                    </div>
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