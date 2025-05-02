import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { joinGroup } from '../../api/groupApi';
import toast from 'react-hot-toast';

export default function JoinGroupPage() {
  const { code } = useParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const join = async () => {
      try {
        const res = await joinGroup(code);
        setMessage(`Joined group: ${res.data.group.name}`);
        toast.success('Group joined!');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Error');
        toast.error('Failed to join group');
      }
    };
    join();
  }, [code]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Join Group</h2>
      <p>{message}</p>
    </div>
  );
}
