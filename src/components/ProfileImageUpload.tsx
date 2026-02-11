import React, { useState, useRef } from 'react';
import './ProfileImageUpload.css';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange?: (imageUrl: string) => void;
  editable?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  onImageChange,
  editable = true,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        onImageChange?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="profile-image-upload">
      <div className="profile-image-container">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Profile" 
            className="profile-image"
          />
        ) : (
          <div className="profile-placeholder">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
      </div>
      
      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
          />
          <button 
            onClick={handleEditClick}
            className="edit-button"
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
};

export default ProfileImageUpload;
