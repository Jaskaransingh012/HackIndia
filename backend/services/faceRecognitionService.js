import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.FACE_API_URL || 'http://localhost:8000';

async function getFaceEmbeddings(imagePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));

        
        const response = await axios.post(
            `${API_BASE_URL}/embedding`,
            form,
            {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data.embedding;
    } catch (error) {
        throw new Error(`Face API error: ${error.response?.data?.error || error.message}`);
    }
}

async function compareEmbeddings(embedding1, embedding2) {
    try {
        const response = await axios.post(`${API_BASE_URL}/compare-embeddings`, {
            embedding1,
            embedding2
        });

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data.similarity;
    } catch (error) {
        throw new Error(`Comparison API error: ${error.response?.data?.error || error.message}`);
    }
}

async function saveImage(imageFile) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const filename = `${uuidv4()}${path.extname(imageFile.originalname)}`;
        const filePath = path.join(uploadDir, filename);
        
        await fs.promises.writeFile(filePath, imageFile.buffer);
        return filePath;
    } catch (error) {
        throw new Error(`Image save failed: ${error.message}`);
    }
}

export {
    getFaceEmbeddings,
    compareEmbeddings,
    saveImage,
}
