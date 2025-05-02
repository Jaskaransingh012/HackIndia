import { useState } from 'react';
import { createGroup } from '../../api/groupApi';
import toast from 'react-hot-toast';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setIsLoading(true);
    try {
      const res = await createGroup(name);
      setCode(res.data.joinCode);
      toast.success('Group created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>👥 Create Group</h2>
        <label htmlFor="groupName" style={{
          fontSize: '16px',
          marginBottom: '5px',
          color: '#555'
        }}>Group Name</label>
        <input
          id="groupName"
          type="text"
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            marginBottom: '20px',
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '16px'
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={handleCreate}
          disabled={!name || isLoading}
          style={{
            backgroundColor: name ? '#22c55e' : '#ccc',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '18px',
            cursor: name && !isLoading ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '100%'
          }}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </button>
        {code && (
  <div style={{
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <p style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Group Created Successfully!</p>
    <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
      Share this link to invite members:
    </p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginRight: '10px', wordBreak: 'break-all' }}>
        {`${window.location.origin}/join/${code}`}
      </p>
      <button
        onClick={() => {
          const joinLink = `${window.location.origin}/join/${code}`;
          navigator.clipboard.writeText(joinLink);
          toast.success('Link copied to clipboard!');
        }}
        style={{
          backgroundColor: '#22c55e',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Copy
      </button>
    </div>
  </div>
)}

      </div>
    </div>
  );
}