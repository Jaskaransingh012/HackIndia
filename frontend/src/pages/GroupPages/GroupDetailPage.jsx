import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { getGroupDetails, deletePicture, uploadPictures } from '../../api/groupApi';
import toast from 'react-hot-toast';
import './GroupDetails.css';

Modal.setAppElement('#root');

export default function GroupDetailsPage() {
  const { id } = useParams();
  const [group, setGroup] = useState({ pictures: [], members: [] });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const { data } = await getGroupDetails(id);
      setGroup(data.group);
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group details');
    }
  }, [id]);

  const handleUpload = async (files) => {
    const toastId = toast.loading(`Uploading ${files.length} images...`);
    try {
      await uploadPictures(id, files);
      toast.success('Upload completed!');
      await loadGroup();
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      toast.dismiss(toastId);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {'image/*': []},
    multiple: true,
    maxSize: 20 * 1024 * 1024, // 20MB
    onDrop: handleUpload
  });

  const handleDelete = async (picId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    setIsDeleting(true);
    try {
      await deletePicture(picId);
      setGroup(prev => ({
        ...prev,
        pictures: prev.pictures.filter(pic => pic._id !== picId)
      }));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  return (
    <div className="group-details-container">
      {/* Header Section */}
      <motion.header 
        className="group-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="header-content">
          <h1 className="group-title">{group.name}</h1>
          <div className="group-meta">
            <div className="join-code-container">
              <span className="join-code-label">Join Code:</span>
              <motion.div 
                className="join-code"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{group.uniqueCode}</span>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(group.uniqueCode);
                    toast.success('Copied to clipboard!');
                  }}
                >
                  <svg className="copy-icon" viewBox="0 0 24 24">
                    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                  </svg>
                </button>
              </motion.div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="upload-btn"
              onClick={() => document.querySelector('.dropzone input').click()}
            >
              <span>📸 Upload Photos</span>
              <div className="upload-pulse"></div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Drag & Drop Zone */}
      <motion.div 
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <input {...getInputProps()} />
        <div className="drop-content">
          <div className="upload-icon">
            <svg className="upload-svg" viewBox="0 0 24 24">
              <path d="M14,13V17H10V13H7L12,8L17,13H14M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z"/>
            </svg>
          </div>
          <h3 className="drop-title">
            {isDragActive ? 'Drop to upload!' : 'Drag & drop photos'}
          </h3>
          <p className="drop-subtitle">or click to browse files</p>
          <small className="drop-note">Supports JPEG, PNG, HEIC up to 20MB</small>
        </div>
      </motion.div>

      {/* Image Gallery */}
      <div className="gallery-section">
        <h2 className="section-title">
          Gallery <span className="count-badge">{(group.pictures || []).length}</span>
        </h2>
        
        {group.pictures?.length ? (
          <div className="image-grid">
            {group.pictures.map(pic => (
              <motion.div 
                key={pic._id}
                className="image-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <img 
                  src={pic.url} 
                  alt="Group content"
                  className="gallery-image"
                  onClick={() => setSelectedImage(pic.url)}
                />
                
                <div className="image-overlay">
                  <span className="uploader">@{pic.userId?.username || 'user'}</span>
                  <motion.button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pic._id);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isDeleting}
                  >
                    <svg className="trash-icon" viewBox="0 0 24 24">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-gallery">
            <div className="empty-icon">🖼️</div>
            <h3>No photos yet</h3>
            <p>Upload the first photo to get started!</p>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="members-section">
        <h2 className="section-title">
          Members <span className="count-badge">{group.members?.length || 0}</span>
        </h2>
        <div className="members-grid">
          {group.members?.map(member => (
            <motion.div 
              key={member._id}
              className="member-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="member-avatar">
                {member.username?.[0].toUpperCase() || 'U'}
              </div>
              <div className="member-info">
                <h3>{member.username}</h3>
                <p>{member.email}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
        className="image-modal"
        overlayClassName="modal-overlay"
      >
        <img src={selectedImage} alt="Full size" className="modal-image" />
        <button 
          className="modal-close"
          onClick={() => setSelectedImage(null)}
        >
          &times;
        </button>
      </Modal>
    </div>
  );
}