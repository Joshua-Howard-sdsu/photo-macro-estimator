import { useState, useRef } from 'react';
import { FaCamera, FaImage, FaTimes } from 'react-icons/fa';

/**
 * Component for uploading and previewing food images
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onImageSelected - Callback when image is selected
 */
const ImageUploader = ({ onImageSelected }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };
  
  // Process the selected file
  const processFile = (file) => {
    // Create a preview URL for the image
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    
    // Call the parent component's callback
    if (onImageSelected) {
      onImageSelected(file);
    }
  };
  
  // Handle the drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };
  
  return (
    <div className="w-full animate-fade-in">
      {previewUrl ? (
        // Image preview
        <div className="relative overflow-hidden rounded-md border border-gray-100">
          <img 
            src={previewUrl} 
            alt="Food preview" 
            className="w-full h-64 object-cover"
          />
          <button
            onClick={() => {
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-3 right-3 bg-white text-gray-700 rounded-md p-2 shadow-sm hover:bg-gray-50 transition-all"
            aria-label="Remove image"
          >
            <FaTimes size={16} />
          </button>
        </div>
      ) : (
        // Upload zone
        <div
          className={`border border-dashed rounded-md p-8 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center h-40 py-4">
            <FaCamera className="text-3xl text-gray-400 mb-4" />
            <p className="text-base font-medium text-gray-700 mb-2">
              Upload a food photo
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag & drop or click to select
            </p>
            <button className="btn btn-primary flex items-center gap-2">
              <FaImage size={16} /> Select Image
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader; 