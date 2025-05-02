import mongoose from 'mongoose';
import { Group } from "../models/group.model.js";
import { Picture } from "../models/picture.model.js";
import { User } from "../models/user.model.js";
import { getFaceEmbeddings, compareEmbeddings, saveImage } from '../services/faceRecognitionService.js';

const THRESHOLD = 0.75;

export const createGroup = async (req, res) => {
    console.log("first")
    let { name } = req.body;
    const creator = req.userId;
    name = name.name;
    console.log(name)
    try {
        const existingByName = await Group.findOne({ name });
        if (existingByName) {
            return res.status(400).json({ message: 'Group name already in use' });
        }
        const generateUniqueCode = () => {
            return Math.random().toString(36).substr(2, 8).toUpperCase();
        };
        console.log("second")
        let code;
        let existingGroup;
        
        do {
            code = generateUniqueCode();
            existingGroup = await Group.findOne({ uniqueCode: code });
        } while (existingGroup);
        console.log("third")
        const group = new Group({
            name,
            creator,
            members: [creator],
            uniqueCode: code,
            pictures: []
        });

        await group.save();

        await User.findByIdAndUpdate(
            creator,
            { $addToSet: { group: group._id } },
            { new: true }
        );

        res.status(201).json({ ...group._doc, joinCode: code });
    } catch (error) {
        console.log(error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Code already in use' });
        }
        res.status(500).json({ message: 'Error creating group', error: error.message });
    }
};

export const joinGroup = async (req, res) => {
    const { code } = req.params;
    const userId = req.userId;

    try {
        const group = await Group.findOne({ uniqueCode: code }).populate('creator', 'username');

        if (!group) {
            return res.status(404).json({ 
                success: false,
                message: 'Group not found with this code' 
            });
        }

        if (group.members.includes(userId)) {
            return res.redirect(`/group/${code}`); // Redirect if already member
        }

        // Add to members
        group.members.push(userId);
        await group.save();

        // Update user's groups
        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { groups: group._id } },
            { new: true }
        );

        // Redirect to group page after successful join
        res.redirect(`/group/${code}`);

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error joining group', 
            error: error.message 
        });
    }
};

export const uploadPicture = async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.userId;
      const file = req.file;
  
      // Verify group membership
      const group = await Group.findOne({ 
        uniqueCode: groupId,
        members: userId 
      }).lean();
  
      if (!group) return res.status(403).json({ message: 'Access denied' });
  
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `group_${groupId}`,
        public_id: uuidv4(),
        resource_type: 'auto'
      });
  
      // Generate face embeddings
      const embeddings = await getFaceEmbeddings(file.buffer);
      if (!embeddings.length) {
        return res.status(400).json({ message: 'No faces detected' });
      }
  
      // Store in database
      const picture = await Picture.create({
        url: result.secure_url,
        publicId: result.public_id,
        embedding: embeddings[0],
        group: group._id,
        userId
      });
  
      // Update group
      await Group.findByIdAndUpdate(group._id, {
        $push: { pictures: picture._id }
      });
  
      res.status(201).json(picture);
    } catch (error) {
      res.status(500).json({ 
        message: 'Upload failed',
        error: error.message 
      });
    }
  };

  export const getUserGallery = async (req, res) => {
    try {
      const userId = req.userId;
      
      // Get user's face embedding
      const user = await User.findById(userId);
      if (!user?.profilePic?.embedding) {
        return res.status(400).json({ message: 'Complete profile setup first' });
      }
  
      // Get all groups and pictures
      const groups = await Group.find({ members: userId });
      const pictures = await Picture.find({
        group: { $in: groups.map(g => g._id) }
      }).populate('group');
  
      // Face matching
      const matches = await Promise.all(
        pictures.map(async (pic) => {
          const similarity = await compareEmbeddings(
            user.profilePic.embedding,
            pic.embedding
          );
          return { pic, similarity };
        })
      );
  
      // Filter matches
      const validMatches = matches
        .filter(({ similarity }) => similarity >= THRESHOLD)
        .map(({ pic }) => ({
          _id: pic._id,
          url: pic.url,
          group: pic.group.name,
          createdAt: pic.createdAt
        }));
  
      res.json({ count: validMatches.length, pictures: validMatches });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to load gallery',
        error: error.message
      });
    }
  };
  


export const getUserGroups = async (req, res) => {
    const userId = req.userId;

    try {
        const groups = await Group.find({ creator: userId }).populate('creator', 'username email');

        res.status(200).json({
            count: groups.length,
            groups
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching user groups',
            error: error.message
        });
    }
};

export const getGroupDetails = async (req, res) => {
    console.log("first")
    const { groupId } = req.params;
    const userId = req.userId;
    console.log(groupId)

    try {
        const group = await Group.findOne({ uniqueCode: groupId })
            .populate('creator', 'username email')
            .populate({
                path: 'pictures',
                select: 'url createdAt userId',
                populate: { path: 'userId', select: 'username' }
            })
            .populate('members', 'username email');

        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.some(member => member._id.toString() === userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.status(200).json({ group });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Failed to fetch group details', error: err.message });
    }
};

export const deletePicture = async (req, res) => {
    try {
      const { pictureId } = req.params;
      const userId = req.userId;
  
      const picture = await Picture.findById(pictureId)
        .populate('group', 'creator members');
  
      // Authorization check
      const isOwner = picture.userId.toString() === userId;
      const isAdmin = picture.group.creator.toString() === userId;
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(picture.publicId);
  
      // Delete from database
      await Picture.deleteOne({ _id: pictureId });
      await Group.updateOne(
        { _id: picture.group._id },
        { $pull: { pictures: pictureId } }
      );
  
      res.json({ message: 'Picture deleted successfully' });
    } catch (error) {
      res.status(500).json({
        message: 'Deletion failed',
        error: error.message
      });
    }
  };

export const uploadZipOrFolder = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;
    const imageFiles = req.files;

    try {
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) return res.status(403).json({ message: 'Not a group member or invalid group' });

        const savedPictures = [];

        for (const imageFile of imageFiles) {
            const imagePath = await saveImage(imageFile);
            const sizeInMB = (imageFile.size / (1024 * 1024)).toFixed(2);
            const faceEmbeddings = await getFaceEmbeddings(imagePath);
            const primaryEmbedding = faceEmbeddings[0];

            const picture = new Picture({
                userId,
                embedding: primaryEmbedding,
                url: imagePath,
                group: groupId
            });

            await picture.save();
            group.pictures.push(picture._id);
            savedPictures.push({
                id: picture._id,
                url: picture.url,
                sizeInMB,
                createdAt: picture.createdAt
            });
        }

        await group.save();

        res.status(201).json({
            message: `${savedPictures.length} pictures uploaded successfully`,
            pictures: savedPictures
        });

    } catch (err) {
        res.status(500).json({ message: 'Error uploading folder', error: err.message });
    }
};
// This assumes images are already extracted from the ZIP before sending
export const uploadZip = async (req, res) => {
    // You can alias to uploadFolder for now if they work the same
    return uploadFolder(req, res);
};
export const removeMember = async (req, res) => {
    const { groupId, memberId } = req.params;
    const requesterId = req.userId;

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.creator.toString() !== requesterId) {
            return res.status(403).json({ message: 'Only the creator can remove members' });
        }

        group.members.pull(memberId);
        await group.save();

        await User.findByIdAndUpdate(
            memberId,
            { $pull: { group: group._id } }
        );

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error removing member', error: err.message });
    }
};

// Add to group.controller.js
export const deleteGroup = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.userId;

    try {
        const group = await Group.findOne({ uniqueCode: groupId });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (group.creator.toString() !== userId) {
            return res.status(403).json({ message: 'Only creator can delete group' });
        }

        // Remove group from all members
        await User.updateMany(
            { _id: { $in: group.members } },
            { $pull: { group: group._id } }
        );

        // Delete all associated pictures
        await Picture.deleteMany({ group: group._id });
        await Group.findByIdAndDelete(group._id);

        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting group', error: error.message });
    }
};

export const getUserJoinedGroups = async (req, res) => {
    console.log("aaya")
    const userId = req.userId;

    try {
        const groups = await Group.find({ 
            members: userId,
            creator: { $ne: userId }
        })
        .populate('creator', 'username email')
        .populate('members', 'username');

        res.status(200).json({
            count: groups.length,
            groups
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching joined groups',
            error: error.message
        });
    }
};

