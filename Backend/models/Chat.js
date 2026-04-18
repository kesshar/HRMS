const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization1',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    }],
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'messages.senderModel'
        },
        senderModel: {
            type: String,
            required: true,
            enum: ['Employee', 'Organization1'],
            default: 'Employee'
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        messageType: {
            type: String,
            enum: ['text', 'file', 'image'],
            default: 'text'
        },
        fileUrl: String,
        readBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    isGroupChat: {
        type: Boolean,
        default: false
    },
    groupName: String,
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat.messages'
    },
    isAdminChat: {
        type: Boolean,
        default: false
    },
    linkedReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

chatSchema.index({ organization: 1, participants: 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
