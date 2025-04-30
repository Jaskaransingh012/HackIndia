import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import { useState } from "react";
import EditProfileModal from "../components/EditProfileModal";
import "../css/DashboardPage.css";

// SVG Icon Components
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => logout();
  const toggleEdit = () => setIsEditing((prev) => !prev);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="dashboard-container"
    >
      <h2 className="dashboard-heading">Dashboard</h2>

      <div className="profile-section">
        <motion.img
          src={user.profilePic || "/default-avatar.png"}
          alt="Profile"
          className="profile-picture"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        />
        <motion.button
          className="edit-profile-btn"
          onClick={toggleEdit}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <EditIcon />
          Edit Profile
        </motion.button>
      </div>

      <div className="dashboard-content">
        <motion.div
          className="info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
        >
          <h3 className="card-heading">Profile Information</h3>
          <p className="info-text">Name: {user.name}</p>
          <p className="info-text">Email: {user.email}</p>
        </motion.div>

        <motion.div
          className="info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4 }}
        >
          <h3 className="card-heading">Account Activity</h3>
          <p className="info-text">
            <span className="font-bold">Joined: </span>
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="info-text">
            <span className="font-bold">Last Login: </span>
            {formatDate(user.lastLogin)}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="logout-container"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="logout-button"
        >
          <LogoutIcon />
          Logout
        </motion.button>
      </motion.div>

      {isEditing && <EditProfileModal user={user} onClose={toggleEdit} />}
    </motion.div>
  );
};

export default DashboardPage;