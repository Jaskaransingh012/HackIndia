import { motion } from "framer-motion";
import Input from "../components/Input";
import { Loader, Lock, Mail, User, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import "../css/SignUpPage.css";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoStream, setVideoStream] = useState(null);
  
  const navigate = useNavigate();
  const { signup, error, isLoading } = useAuthStore();

  // Start/stop camera when camera interface is toggled
  useEffect(() => {
    if (showCameraInterface) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [showCameraInterface]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } // Front camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setVideoStream(stream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions.");
      setShowCameraInterface(false);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
      setVideoStream(null);
    }
  };

  const capturePhoto = () => {
    if (!isCameraActive || !canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to Blob then to File
    canvas.toBlob((blob) => {
      const file = new File([blob], 'profile-photo.jpg', { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setShowCameraInterface(false);
    }, 'image/jpeg', 0.9);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCameraInterface(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      await signup(formData);
      navigate("/verify-email");
    } catch (error) {
      // Error is handled by authStore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="signup-container"
    >
      <div className="signup-inner">
        <h2 className="signup-heading">Create Account</h2>

        <form onSubmit={handleSignUp}>
          <div className="profile-pic-section">
            {showCameraInterface ? (
              <div className="camera-interface">
                {cameraError ? (
                  <div className="camera-error">
                    <p>{cameraError}</p>
                    <button 
                      type="button"
                      className="switch-mode-button"
                      onClick={() => setShowCameraInterface(false)}
                    >
                      Upload Instead
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      className="camera-preview"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="camera-controls">
                      <button
                        type="button"
                        className="capture-button"
                        onClick={capturePhoto}
                        disabled={!isCameraActive}
                      >
                        <Camera size={24} />
                      </button>
                      <button
                        type="button"
                        className="switch-mode-button"
                        onClick={() => setShowCameraInterface(false)}
                      >
                        Upload Photo
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <label htmlFor="profilePic" className="profile-pic-label">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" className="profile-pic-preview" />
                  ) : (
                    <div className="profile-pic-placeholder">
                      <User size={24} className="profile-pic-icon" />
                      <p>Add Profile Picture</p>
                    </div>
                  )}
                </label>
                <input
                  type="file"
                  id="profilePic"
                  className="profile-pic-input"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                />
                <button
                  type="button"
                  className="switch-mode-button"
                  onClick={() => setShowCameraInterface(true)}
                >
                  Take Photo
                </button>
              </>
            )}
          </div>

          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="error-message">{error}</p>}
          <PasswordStrengthMeter password={password} />

          <motion.button
            className="signup-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </form>
      </div>
      
      <div className="signup-footer">
        <p className="footer-text">
          Already have an account?{" "}
          <Link to="/login" className="footer-link">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUpPage;