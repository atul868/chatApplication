const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupsSchema = new Schema(
  {
    groupName: {
      type: String,
      unique: true
    },
    groupMembers: {
      type: Array,
    },
    type: {
      type: String,
      enum: ['onetoone', 'group'],
      default: 'onetoone',
    },
    senderId: {
      type: String,
    },
    removedUsers: {
      type: Map,
      required: true,
      default: new Map(),
    },
    addedUsers: {
      type: Map,
      of: [Date],
      required: true,
      default: new Map(),
    },
    status: {
      type: String,
      enum: ['open', 'close'],
      default: 'open',
    },
    adminMembers: {
      type: Array,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    last_message: {
      type: Object,
      default: {
        send_At: new Date(),
        message: ''
      },
    },
    profile_img: {
      type: String,
      default: null
    },
    muteUsers: {
      type: Array,
      default: [],
    },
    block_userId: {
      type : String,
      default: null
    }
  },
  {
    timestamps: true,
  },
);

const Groups = mongoose.model('groups', groupsSchema);

module.exports = Groups;

