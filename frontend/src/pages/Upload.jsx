import React, { useState, useRef, useEffect } from 'react';
import '../css/DragDropPage.css';
import { zipToFiles } from '../deepface/ZipfileConverter';
import DropZone from '../components/DropZone';
import CircularProgressWithLabel from '../components/Loader';
import { useNavigate } from 'react-router-dom';

function Upload() {
  const navigate = useNavigate();

  // State variables
  const [isLeftLoading, setIsLeftLoading] = useState(false);
  const [leftFiles, setLeftFiles] = useState([]);
  const [leftName, setLeftName] = useState(null);
  const [isRightLoading, setIsRightLoading] = useState(false);
  const [rightFile, setRightFile] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const processEntry = async (entry, fileList) => {
    const reader = entry.createReader();
    const readEntries = () => new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    const entries = await readEntries();
    for (const entry of entries) {
      if (entry.isDirectory) {
        await processEntry(entry, fileList);
      } else if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve));
        fileList.push(file);
      }
    }
  };

  const handleLeftDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLeftLoading(true);
    const items = e.dataTransfer.items;
    const files = [];
    let name = null;
    const promises = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) {
            name = entry.name;
            promises.push(processEntry(entry, files));
          } else {
            promises.push(
              new Promise((resolve) => {
                entry.file((file) => {
                  if (file.name.endsWith('.zip')) {
                    name = file.name;
                    zipToFiles(file).then((zipFiles) => {
                      files.push(...zipFiles);
                      resolve();
                    });
                  } else {
                    resolve();
                  }
                });
              })
            );
          }
        }
      }
    }

    await Promise.all(promises);
    setLeftFiles(files);
    setLeftName(name);
    setIsLeftLoading(false);
  };

  const handleLeftFileInputChange = async (e) => {
    setIsLeftLoading(true);
    const files = e.target.files;
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
      const zipFiles = await zipToFiles(files[0]);
      setLeftFiles(zipFiles);
      setLeftName(files[0].name);
    } else {
      alert('Please select a .zip file.');
    }
    setIsLeftLoading(false);
  };

  const handleLeftReset = () => {
    setLeftFiles([]);
    setLeftName(null);
  };

  const handleRightDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRightLoading(true);
    const files = e.dataTransfer.files;
    if (files.length === 1 && files[0].type.startsWith('image/')) {
      setRightFile(files[0]);
    } else {
      alert('Please drop a single image file.');
    }
    setIsRightLoading(false);
  };

  const handleRightFileInputChange = (e) => {
    setIsRightLoading(true);
    const files = e.target.files;
    if (files.length === 1 && files[0].type.startsWith('image/')) {
      setRightFile(files[0]);
    } else {
      alert('Please select a single image file.');
    }
    setIsRightLoading(false);
  };

  const handleRightReset = () => {
    setRightFile(null);
  };

  const handleCamera = async () => {
    try {
      if (isCameraActive) {
        stopCamera();
        return;
      }

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
            setCameraError('Error accessing camera feed');
          });
        };
        setIsCameraActive(true);
        setCameraError(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Camera access denied. Please check permissions.');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(blob => {
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      setRightFile(file);
      stopCamera();
    }, 'image/png');
  };

  const handleFilterClick = async () => {
    if (!leftFiles.length || !rightFile) return;

    setIsFiltering(true);
    setProgress(0);

    const totalFiles = leftFiles.length;
    let processedFiles = 0;
    const matchingFiles = [];

    try {
      for (const file of leftFiles) {
        if (!file.name.startsWith('__MACOSX') && !file.name.endsWith('.DS_Store')) {
          const formData = new FormData();
          formData.append("img1", file, file.name);
          formData.append("img2", rightFile, rightFile.name);

          try {
            const res = await fetch("http://127.0.0.1:8000/verify", {
              method: "POST",
              body: formData,
            });

            const result = await res.json();
            console.log(`Result for ${file.name}:`, result);

            if (result.verified) {
              matchingFiles.push(file);
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
          }
        }

        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }

      const matchingFileURLs = matchingFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setIsFiltering(false);
      setProgress(0);
      navigate('/preview', {
        state: {
          files: matchingFileURLs,
        }}
      );
    } catch (err) {
      console.error("Error processing files:", err);
    }
  };

  return (
    <div className="unzip-container">
      <h1 style={{ color: 'white', fontSize: '40px', textAlign: 'center' }}>
        Free Online Face Filter
      </h1>
      <br />
      <p style={{ color: 'white', fontSize: '20px', textAlign: 'center' }}>
        Upload and filter your face among others online.
      </p>
      <div className="content-container">
      {isFiltering ? <CircularProgressWithLabel style={{ color: '#10b981' }} size={150} value={progress} /> :
        <div className="drop-zones-container">
          <div className="left-drop-zone">
            <DropZone
              id="leftFileInput"
              accept=".zip"
              multiple={false}
              handleFileInputChange={handleLeftFileInputChange}
              handleDrop={handleLeftDrop}
              isLoading={isLeftLoading}
              isUploaded={leftFiles.length > 0}
              renderUploadedContent={() => (
                <div className="uploaded-content">
                  <div className="folder-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <span>{leftName}</span>
                  <button className="reset-button" onClick={handleLeftReset}>
                    Change folder/zip
                  </button>
                </div>
              )}
              defaultMessage="Drag folder or zip file here or click to select"
            />
            {leftFiles.length > 0 && (
              <p className="file-count">{leftFiles.length} files selected</p>
            )}
          </div>

          <div className="right-drop-zone">
            <DropZone
              id="rightFileInput"
              accept="image/*"
              multiple={false}
              handleFileInputChange={handleRightFileInputChange}
              handleDrop={handleRightDrop}
              isLoading={isRightLoading}
              isUploaded={rightFile !== null}
              renderUploadedContent={() => (
                <div className="uploaded-content">
                  {rightFile && (
                    <img
                      src={URL.createObjectURL(rightFile)}
                      alt="Uploaded"
                      style={{ maxWidth: '100px', maxHeight: '100px' }}
                    />
                  )}
                  <span>{rightFile?.name}</span>
                  <button className="reset-button" onClick={handleRightReset}>
                    Change image
                  </button>
                </div>
              )}
              defaultMessage="Drag a single image here or click to select"
            />
            <div className="camera-options">
              <button 
                className="camera-button"
                onClick={handleCamera}
                disabled={isFiltering}
              >
                {isCameraActive ? 'Stop Camera' : 'Use Camera'}
              </button>
              
              {cameraError && (
                <div className="camera-error">{cameraError}</div>
              )}

              <div className="camera-preview" style={{ display: isCameraActive ? 'block' : 'none' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
                {isCameraActive && (
                  <button 
                    className="capture-button"
                    onClick={handleCapture}
                  >
                    Capture
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>}

        <button
          className="filter-button"
          disabled={leftFiles.length === 0 || rightFile === null || isFiltering}
          onClick={handleFilterClick}
        >
          {isFiltering ? 'Filtering...' : 'Filter your images'}
        </button>
      </div>
    </div>
  );
}

export default Upload;