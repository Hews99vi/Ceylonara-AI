import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './announcementPage.css';

const AnnouncementPage = () => {
  const [announcement, setAnnouncement] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const { getToken } = useAuth();

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
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('announcement', announcement);
      if (image) {
        formData.append('image', image);
      }
      
      await fetch(`${import.meta.env.VITE_API_URL}/api/factory/announcement`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      setAnnouncement('');
      setImage(null);
      setImagePreview(null);
      setPostSuccess(true);
      setTimeout(() => {
        setPostSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Failed to post announcement. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="announcementPage">
      <h2>Post Announcement</h2>
      <p className="subheading">Publish an announcement to farmers</p>
      
      {postSuccess && (
        <div className="successMessage">
          Announcement posted successfully!
        </div>
      )}
      
      <form onSubmit={handleAnnouncementSubmit}>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Write your announcement here..."
          rows={8}
          className="announcementTextarea"
        />
        
        <div className="imageUploadSection">
          <label htmlFor="image-upload" className="imageUploadLabel">
            <span className="uploadIcon">📷</span>
            <span>Add Image</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="imageInput"
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
  );
};

export default AnnouncementPage; 