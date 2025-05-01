import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    profilePic: {
      type: {
        url: String,
        embedding: [Number]
      },
      default: null
    },

    gallery: [{
        url: {
          type: String,
          required: true
        },
        sizeInMB: {
          type: Number,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],     
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
},{timestamps: true});


export const User = mongoose.model('User', userSchema);
