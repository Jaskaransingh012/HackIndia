// utils/faceProcessor.js
import axios from 'axios';
import { Picture } from '../models/picture.model.js';
import { User } from '../models/user.model.js';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const DEEPFACE_API = 'http://localhost:8000/verify';
const THRESHOLD = 0.75;

async function bufferToFormData(imageBuffer, filename) {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('image', blob, filename);
  return formData;
}

async function compareFaces(img1Path, img2Path) {
  try {
    const formData = new FormData();
    
    // Read files as streams and append to form data
    formData.append('img1', createReadStream(img1Path));
    formData.append('img2', createReadStream(img2Path));

    const response = await axios.post(DEEPFACE_API, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.similarity;
  } catch (error) {
    console.error('DeepFace API error:', error.message);
    return 0;
  }
}

export async function processPhotoForUser(pictureId, userId) {
  try {
    const [picture, user] = await Promise.all([
      Picture.findById(pictureId).select('path processedUsers'),
      User.findById(userId).select('profilePicPath')
    ]);

    if (!user?.profilePicPath || 
        !picture?.path ||
        picture.processedUsers.includes(userId)) {
      return;
    }

    // Create temp paths
    const tempDir = tmpdir();
    const userImgPath = join(tempDir, `user_${userId}.jpg`);
    const photoPath = join(tempDir, `photo_${pictureId}.jpg`);

    // Implement logic to retrieve actual image files here
    // This could be from cloud storage or local filesystem
    // For example, using Cloudinary SDK:
    // await cloudinary.download(user.profilePicPublicId, userImgPath);
    // await cloudinary.download(picture.publicId, photoPath);

    const similarity = await compareFaces(userImgPath, photoPath);

    if (similarity >= THRESHOLD) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { gallery: picture._id } }
      );
    }

    await Picture.updateOne(
      { _id: pictureId },
      { $addToSet: { processedUsers: userId } }
    );

  } catch (error) {
    console.error(`Error processing photo ${pictureId} for user ${userId}:`, error);
  }
}