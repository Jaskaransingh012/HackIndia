import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5001/api/group',
    withCredentials: true
});

export const joinGroup = (code) => API.post(`/join/${code}`);
// groupApi.js
export const getCreatedGroups = async () => {
    return axios.get('http://localhost:5001/api/group/created-groups');
};

export const getJoinedGroups = async () => {
    return API.get('/joined-groups');
};
export const uploadPicture = (groupId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return API.post(`/upload/${groupId}`, formData);
};

export const getGroupDetails = (groupId) =>
    API.get(`/${groupId}`);
  
  export const deletePicture = (picId) =>
    API.delete(`/pictures/${picId}`);
  
  export const uploadPictures = (groupId, formData) =>
    API.post(`/${groupId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });


    // In groupApi.js
export const createGroup = async (name) => {
    const res = await API.post('/create', { name });
    return res.data;
  };
  
  export const deleteGroup = async (groupId) => {
    const res = await API.delete(`/${groupId}`);
    return res.data;
  };
// export const getGallery = () => API.get('/gallery');
