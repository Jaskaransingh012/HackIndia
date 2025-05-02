import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatedGroups, getJoinedGroups, createGroup, deleteGroup } from '../../api/groupApi';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { ThreeDots } from 'react-loader-spinner';

// Get user ID from token utility function
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

Modal.setAppElement('#root');

export default function MyGroupsPage() {
  const [createdGroups, setCreatedGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const [createdRes, joinedRes] = await Promise.all([
        getCreatedGroups(),
        getJoinedGroups()
      ]);
      
      setCreatedGroups(createdRes.data.groups);
      setJoinedGroups(joinedRes.data.groups);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchGroups(); 
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return toast.error('Group name is required');
    try {
      await createGroup({ name: newGroupName });
      await fetchGroups();
      setShowCreateModal(false);
      setNewGroupName('');
      toast.success('Group created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    }
  };

  const confirmDelete = async (groupId, groupName) => {
    if (window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone!`)) {
      try {
        await deleteGroup(groupId);
        await fetchGroups();
        toast.success('Group deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete group');
      }
    }
  };

  const GroupCard = ({ group }) => (
    <div className="group-card">
      <div className="card-gradient"></div>
      <div className="card-content">
        <h3 className="group-name">{group.name}</h3>
        <div className="group-details">
          <p className="join-code">
            <span>🔑</span> {group.uniqueCode}
          </p>
          <p className="creator">
            <span>👤</span> {group.creator?.username || 'Unknown'}
          </p>
        </div>
        <div className="card-actions">
          <button 
            className="view-btn"
            onClick={() => navigate(`/group/${group.uniqueCode}`)}
          >
            Explore Group
          </button>
          {group.creator?._id === userId && (
            <button 
              className="delete-btn"
              onClick={() => confirmDelete(group._id, group.name)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="groups-container">
      <div className="hero-header">
        <h1>My Groups Hub</h1>
        <button 
          className="create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span>+</span> New Group
        </button>
      </div>

      <Modal
        isOpen={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
        className="create-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Start New Group</h2>
        <input
          type="text"
          placeholder="Enter group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="modal-input"
        />
        <div className="modal-actions">
          <button className="confirm-btn" onClick={handleCreateGroup}>
            Create Space
          </button>
          <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      {loading ? (
        <div className="loader">
          <ThreeDots color="#3b82f6" height={50} width={50} />
        </div>
      ) : (
        <>
          <section className="groups-section">
            <h2 className="section-title">
              <span className="icon">🚀</span> Your Created Groups ({createdGroups.length})
            </h2>
            {createdGroups.length > 0 ? (
              <div className="groups-grid">
                {createdGroups.map(group => (
                  <GroupCard key={group._id} group={group} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't launched any groups yet!</p>
                <button 
                  className="create-inline-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </section>

          <section className="groups-section">
            <h2 className="section-title">
              <span className="icon">🌍</span> Joined Communities ({joinedGroups.length})
            </h2>
            {joinedGroups.length > 0 ? (
              <div className="groups-grid">
                {joinedGroups.map(group => (
                  <GroupCard key={group._id} group={group} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You're not part of any communities yet!</p>
                <button 
                  className="join-inline-btn"
                  onClick={() => navigate('/explore')}
                >
                  Explore Public Groups
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// Modern CSS Styles
const styles = `
.groups-container {
  min-height: 100vh;
  padding: 2rem 5%;
  background: linear-gradient(to right bottom, #f8fafc, #e2e8f0);
  font-family: 'Inter', sans-serif;
}

.hero-header {
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
  background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
  border-radius: 1.5rem;
  color: white;
  box-shadow: 0 10px 15px rgba(59, 130, 246, 0.15);
}

.hero-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

.create-btn {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.create-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.create-btn span {
  font-size: 1.2em;
}

.groups-section {
  margin-bottom: 4rem;
}

.section-title {
  font-size: 1.75rem;
  margin-bottom: 2rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title .icon {
  font-size: 1.5em;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.group-card {
  background: white;
  border-radius: 1.5rem;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  min-height: 200px;
}

.group-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
}

.card-content {
  position: relative;
  padding: 1.5rem;
  z-index: 1;
}

.group-name {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.group-details {
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(5px);
  margin-bottom: 1rem;
}

.join-code {
  color: #3b82f6;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.creator {
  color: #64748b;
  font-size: 0.9rem;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.view-btn, .delete-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.view-btn {
  background: #3b82f6;
  color: white;
}

.view-btn:hover {
  background: #2563eb;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: rgba(241, 245, 249, 0.5);
  border-radius: 1rem;
  border: 2px dashed #cbd5e1;
}

.create-inline-btn, .join-inline-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.create-inline-btn {
  background: #3b82f6;
  color: white;
  border: none;
}

.join-inline-btn {
  background: #10b981;
  color: white;
  border: none;
}

/* Modal styles */
.create-modal {
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  max-width: 450px;
  margin: 2rem auto;
  border: none;
}

.modal-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  margin: 1rem 0;
  transition: border-color 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-btn {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
}

.cancel-btn {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
}

.loader {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);