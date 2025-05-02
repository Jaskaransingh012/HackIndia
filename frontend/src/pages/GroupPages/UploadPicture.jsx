import { useState } from 'react';
import { uploadPicture } from '../../api/groupApi';

export default function UploadPicture({ groupId }) {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleUpload = async () => {
        if (!file) return;
        try {
            const res = await uploadPicture(groupId, file);
            setMessage(`Uploaded: ${res.data.url}`);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error');
        }
    };

    return (
        <div>
            <h2>Upload Picture</h2>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <button onClick={handleUpload}>Upload</button>
            <p>{message}</p>
        </div>
    );
}
