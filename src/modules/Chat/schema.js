const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema(
    {
        message: {
            type: String,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'groups',
        },
        groupName: {
            type: String,
        },
        senderId: {
            type: String,
        },
        fileName: {
            type: String,
        },
        isFile: {
            type: Boolean,
        },
        fileType: {
            type: String,
        },
        filePath: {
            type: String,
        },
        readUserIds: {
            type: [String],
        },
        metadata: {
            type: Map,
            default: new Map(),
        },
        type: {
            type: String,
        },
        emailNotified: {
            type: Boolean,
            default: false,
        },
        isBroadcast: {
            type: Boolean,
            default: false,
        },
        addedMemberId: {
            type: String,
        },
        isEmailMessage: {
            type: Boolean,
            default: false,
        },
        emailMessagesId: {
            type: String,
        },
        fileUrl: {
            type: String,
        },
        sendTo: {
            type: [String],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    },
);
chatSchema.virtual('test').
    get(function () {
        return this._test;
    }).
    set(function (v) {
        this._test = v;
    });

const chat = mongoose.model('messages', chatSchema);

module.exports = chat;
