import mongoose from "mongoose";

const groupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    code:{
        type: String,
        required: true
    },
    pictures:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Picture',
        required: true
    }]

})

export const Group = mongoose.model('Group', groupSchema);