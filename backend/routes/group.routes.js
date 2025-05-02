import express from 'express';
import {
  createGroup,
  getUserGallery,
  getUserGroups,
  joinGroup,
  uploadPicture,
  uploadZipOrFolder,
  deletePicture,
  getGroupDetails,
  removeMember,
  deleteGroup,
  getUserJoinedGroups
} from '../controllers/group.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import upload from '../middlewares/multer.js';


const router = express.Router();

// Group creation & joining
router.get('/joined-groups', verifyToken, getUserJoinedGroups);
router.get('/created-groups', verifyToken, getUserGroups);

router.post('/create', verifyToken, createGroup);
// routes/group.routes.js
router.get('/join/:code', verifyToken, joinGroup); // Changed from :id to :code

// Upload single image
router.post('/:groupId/upload', verifyToken, upload.single('image'), uploadPicture);

// Upload zip/folder (handled in same controller with different multer setup)
router.post('/:groupId/bulk-upload', verifyToken, upload.single('archive'), uploadZipOrFolder);

// Get personal gallery
router.get('/gallery', verifyToken, getUserGallery);

// Get groups user belongs to
router.get('/my-groups', verifyToken, getUserGroups);

// 🆕 Get group details (info, members, pictures, etc.)
router.get('/:groupId', verifyToken, getGroupDetails);

// 🆕 Delete picture from group
router.delete('/:groupId/pictures/:pictureId', verifyToken, deletePicture);

// 🆕 Remove member from group (admin-only)
router.delete('/:groupId/members/:memberId', verifyToken, removeMember);

router.delete('/:groupId', verifyToken, deleteGroup);



export default router;
