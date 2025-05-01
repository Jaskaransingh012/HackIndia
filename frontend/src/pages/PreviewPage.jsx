import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { useLocation } from 'react-router-dom';
import '../css/PreviewPage.css';
import { Loader, Crop, Sun, Contrast, RotateCcw, RotateCw, XCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

function PreviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // Editing states
  const [brightness, setBrightness] = useState(100); // 0-200%
  const [contrast, setContrast] = useState(100);   // 0-200%
  const [rotation, setRotation] = useState(0);     // degrees
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState(null);  // { x, y, width, height }
  const [tempCrop, setTempCrop] = useState(null);  // Temporary crop during selection

  const canvasRef = useRef(null);
  const location = useLocation();
  const files = location.state?.files || [];

  useEffect(() => {
    setIsDone(false);
    if (modalOpen) {
      drawImage();
    }
  }, [currentIndex, modalOpen, brightness, contrast, rotation, cropRect]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = files[currentIndex].url;
    img.onload = () => {
      const { width, height } = img;
      canvas.width = width;
      canvas.height = height;
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      
      // Apply rotation
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
      
      // Draw image with cropping if applicable
      if (cropRect) {
        ctx.drawImage(
          img,
          cropRect.x, cropRect.y, cropRect.width, cropRect.height,
          0, 0, cropRect.width, cropRect.height
        );
        canvas.width = cropRect.width;
        canvas.height = cropRect.height;
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }
      ctx.restore();

      // Draw temporary crop rectangle if cropping
      if (isCropping && tempCrop) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(tempCrop.x, tempCrop.y, tempCrop.width, tempCrop.height);
      }
    };
  };

  const handleCropStart = (e) => {
    if (!isCropping) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTempCrop({ startX: x, startY: y, x, y, width: 0, height: 0 });
  };

  const handleCropMove = (e) => {
    if (!isCropping || !tempCrop) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), canvas.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), canvas.height);
    setTempCrop((prev) => ({
      ...prev,
      x: Math.min(prev.startX, x),
      y: Math.min(prev.startY, y),
      width: Math.abs(x - prev.startX),
      height: Math.abs(y - prev.startY),
    }));
    drawImage();
  };

  const handleCropEnd = () => {
    if (!isCropping || !tempCrop) return;
    setCropRect({
      x: tempCrop.x,
      y: tempCrop.y,
      width: tempCrop.width,
      height: tempCrop.height,
    });
  };

  const applyCrop = () => {
    setIsCropping(false);
    setTempCrop(null);
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setTempCrop(null);
    setCropRect(null);
    drawImage();
  };

  const rotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360);

  const resetEdits = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setCropRect(null);
    setIsCropping(false);
    setTempCrop(null);
  };

  const handleSaveToGallery = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));
      const formData = new FormData();
      formData.append('picture', blob, files[currentIndex].name);

      const result = await axios.post('http://localhost:5001/api/gallery/upload-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setIsDone(true);
    } catch (error) {
      console.error('Error uploading edited image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    for (const [index, file] of files.entries()) {
      const response = await fetch(file.url);
      const blob = await response.blob();
      zip.file(`match_${index + 1}_${file.name}`, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'filtered_images.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
    resetEdits();
  };

  const closeModal = () => setModalOpen(false);

  const changeImage = (direction) => {
    setCurrentIndex((prevIndex) => (prevIndex + direction + files.length) % files.length);
  };

  return (
    <div className="preview-container">
      <h2 className="heading">Matched Images Preview</h2>
      <div className="image-grid">
        {files.map((file, index) => (
          <div key={index} className="image-card" onClick={() => openModal(index)}>
            <img src={file.url} alt={file.name} />
            <p>{file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}</p>
          </div>
        ))}
      </div>

      <button onClick={handleDownloadZip} className="download-btn">
        Download ZIP
      </button>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closeModal}>×</span>
            <canvas
              ref={canvasRef}
              className="modal-image"
              onMouseDown={handleCropStart}
              onMouseMove={handleCropMove}
              onMouseUp={handleCropEnd}
            />
            <div className="editing-toolbar">
              <div className="tool-group">
                <Sun size={20} className="text-emerald-500" />
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  className="w-24 accent-emerald-500"
                />
              </div>
              <div className="tool-group">
                <Contrast size={20} className="text-emerald-500" />
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value)}
                  className="w-24 accent-emerald-500"
                />
              </div>
              <button onClick={() => setIsCropping(true)} className="tool-btn">
                <Crop size={20} />
              </button>
              <button onClick={rotateLeft} className="tool-btn">
                <RotateCcw size={20} />
              </button>
              <button onClick={rotateRight} className="tool-btn">
                <RotateCw size={20} />
              </button>
              {isCropping && (
                <>
                  <button onClick={applyCrop} className="tool-btn">
                    <CheckCircle size={20} />
                  </button>
                  <button onClick={cancelCrop} className="tool-btn">
                    <XCircle size={20} />
                  </button>
                </>
              )}
            </div>
            <div className="modal-controls">
              <button onClick={() => changeImage(-1)}>⟨</button>
              <button onClick={handleSaveToGallery}>
                {isDone ? "Saved to gallery" : isLoading ? (
                  <Loader className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                ) : (
                  "Save to gallery"
                )}
              </button>
              <button onClick={() => changeImage(1)}>⟩</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PreviewPage;
