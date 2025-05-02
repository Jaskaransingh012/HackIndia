import { useEffect, useState } from 'react';
import { getGallery } from '../../api/groupApi';

export default function UserGallery() {
    const [pictures, setPictures] = useState([]);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await getGallery();
                setPictures(res.data.pictures);
            } catch (err) {
                console.error(err);
            }
        };
        fetchGallery();
    }, []);

    return (
        <div>
            <h2>Your Gallery</h2>
            {pictures.map(pic => (
                <img key={pic.id} src={pic.url} alt="Match" width={150} />
            ))}
        </div>
    );
}
