import mongoose from "mongoose";

const pictureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  processedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true })

export const Picture = mongoose.model("Picture", pictureSchema)
