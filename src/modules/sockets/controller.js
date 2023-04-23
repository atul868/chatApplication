const logs = require('../../../helper/logs');
const socketConfig = require('../../../config/socket');
const { chatUpdate, allUnreadGlobalCount } = require('../Chat/dbQuery');
const { groupFind, groupCreate, groupChatMessageUpdateFind } = require('../Groups/dbQuery');
const { userFind, updateUserDetailOnUserId } = require('../Users/dbQuery');
const group = require('../Groups/schema');
const chat = require('../Chat/schema');
const aws = require('../../../src/services/aws');
const moment = require('moment');
const users = {};
const path = require('path');
const { failure } = require('../../utils/response');
const { serverResponseMessage } = require('../../../config/message');


exports.connection = async function (socket, socketUsers, groupName) {
  socket.join(socket.handshake.query.senderId);
  socketUsers[socket.handshake.query.senderId] = true;
  socket.emit(socketConfig.ALL_ONLINE_NOTIFY_GLOBAL, { users: socketUsers });
  socket.broadcast.emit(socketConfig.NOTIFY_ONLINE_USER, { users: socketUsers });
  logs.groupLogs(socket, groupName);
};


exports.join = async function (data, socket) {
  // console.log("Join Data-->>>", data)
  try {
    const groupName = data.groupName;
    if (data.senderId) {
      users[data.senderId + '_' + groupName] = groupName;
    } else {
      users[groupName] = groupName;
    }
    let clientInfo = {};
    clientInfo = data;
    clientInfo['IPAddress'] = socket.request.connection.remoteAddress;

    /* save chat group to the database */
    let grpObj = await groupFind({ groupName: groupName });
    const array = grpObj ? Object.keys(JSON.parse(JSON.stringify(grpObj.removedUsers))) : 0;
    let index = 1;
    if (data.type == 'onetoone') {
      const grupMembers = groupName.split('-');
      const firstMemberData = await userFind({ userId: grupMembers[0] });
      const secondMemberData = await userFind({ userId: grupMembers[1] });
      if (firstMemberData && secondMemberData) {
        index = 1;
      } else {
        index = 0;
      }
    }
    let isRemoved = false;
    if (array.length > 0) {
      isRemoved = array.includes(data.senderId.toString());
      if (isRemoved == false) socket.join(groupName);
    } else {
      socket.join(groupName);
    }
    if (!grpObj) {
      grpObj = await groupCreate(clientInfo);
    }
    if (index == 1) {
      if (data.senderId % 1 === 0) {
        data.senderId = data.senderId.toString();
      }
      const response = await chatUpdate({ groupName: groupName, senderId: data.senderId })
      socket.broadcast.in(groupName).emit(socketConfig.NOTIFY_USER_READ, { userId: data.senderId });
      const newUnreadData = {};
      newUnreadData['groupName'] = data.groupName;
      data.groupMembers ? data.groupMembers.length > 0 ? newUnreadData['groupMembers'] = data.groupMembers : '' : '';
      newUnreadData['senderId'] = data.senderId;
      newUnreadData['type'] = data.type;
      socket.broadcast.in(groupName).emit(socketConfig.NEW_CHAT_CONNECT, newUnreadData);
    }
  }
  catch (error) {
    return res.json(
      failure(204, serverResponseMessage.ERROR, error.message)
    );
  }

};


exports.chatMessage = async function (socket, msg, senderId, metadata, type, groupName, socketUsers, userName, fileUrl, quoteMsgId) {
  group.findOne({ groupName: groupName }).sort({ createdAt: -1 }).then(async (groups) => {
    const onlineUsers = getOnlineUsers(groupName, senderId);
    onlineUsers.push(senderId);
    groups.updatedAt = moment.utc(new Date());
    groups.save();
    msg = this.sanitize(msg);
    if (msg != '') {
      const readUserIds = [];
      onlineUsers.forEach(async (ids) => {
        if (groups.groupMembers.includes(ids)) {
          readUserIds.push(ids);
        }
      });

      const messageData = {};
      messageData['groupId'] = groups._id,
        messageData['message'] = msg,
        messageData['groupName'] = groupName,
        messageData['senderId'] = senderId,
        messageData['type'] = type,
        messageData['readUserIds'] = readUserIds;
      messageData['userName'] = userName;
      messageData['fileUrl'] = fileUrl;
      messageData['isFile'] = false;
      messageData['sendTo'] = groups.groupMembers;

      const chatMessage = new chat(messageData);

      messageData['createdAt'] = groups.updatedAt;
      messageData['emailNotified'] = chatMessage.emailNotified;
      messageData['isBroadcast'] = chatMessage.isBroadcast;
      messageData['isEmailMessage'] = chatMessage.isEmailMessage;
      messageData['updatedAt'] = groups.updatedAt;
      messageData['__v'] = groups.__v;
      messageData['_id'] = chatMessage._id;
      if (type == 'group' || (type == 'onetoone' && groups.groupMembers.includes(senderId))) {
        const chatMessageObj = await chatMessage.save();
        // //   await Notification.sendNotifications(group, chatMessageObj._id, msg, senderId, type);
        groupChatMessageUpdateFind(groups._id, msg)
        socket.broadcast.in(groupName).emit(socketConfig.RECEIVED, messageData);
        socket.emit(socketConfig.RECEIVED, chatMessageObj);
        notifyUnreadAllGroup(groups, senderId, socketUsers, onlineUsers, socket, msg, userName, type);
        logs.messageLog(groupName, senderId, msg);
      }
    }
  });
};




exports.notifyTypingAllGroup = function (groupName, socket, data, socketUsers, emitName) {
  group.findOne({ groupName: groupName }).sort({ createdAt: -1 }).then((group) => {
    if (!group) return;
    const index = group.groupMembers.indexOf(data.senderId);
    if (index > -1) {
      group.groupMembers.splice(index, 1);
    }
    group.groupMembers.forEach(async (userId) => {
      if (Object.keys(socketUsers).includes(userId)) {
        const message = {
          groupId: group._id,
          groupName: groupName,
          user: data.user,
          message: socketConfig.TYPING_MESSAGE,
          senderId: data.senderId,
          type: data.type,
        };
        socket.broadcast.in(userId).emit(emitName, message);
      }
    });
  });
};


const getOnlineUsers = function (groupName, senderId) {
  let onlineUsers = [];
  const onlineUsersIds = [];
  if (Object.values(users).includes(groupName)) {
    onlineUsers = Object.keys(users).filter((k) => users[k] === groupName);
    const index = onlineUsers.indexOf(senderId);
    if (index > -1) {
      onlineUsers.splice(index, 1);
      logs.onlineUsersLog(groupName, senderId);
    }

    /* New Code for the mobile and web seperator */
    onlineUsers.forEach(async (userId) => {
      const id = userId.split('_');
      if (senderId != id[0]) {
        onlineUsersIds.push(id[0]);
      }
    });
    return onlineUsersIds;
  }
  return onlineUsersIds;
};


exports.updateUserLastSeen = async (userId) => {
  if (userId) {
    const response = await updateUserDetailOnUserId(userId, {
      last_seen: new Date()
    })
  }
}

exports.disconnect = async function (socket, socketUsers) {
  if (socket.handshake.query.senderId) {
    delete users[socket.handshake.query.senderId + '_' + socket.handshake.query.groupName];

    const userData = [];
    Object.keys(users).forEach(function (key) {
      const id = key.split('_');
      userData.push(id[0]);
    });
    if (!userData.includes(socket.handshake.query.senderId)) {
      delete socketUsers[socket.handshake.query.senderId];
    }
  } else {
    delete users[socket.handshake.query.groupName];
  }
  /* remove saved socket from users object */
  delete users[socket.handshake.query.senderId + '_' + socket.handshake.query.groupName];
  socket.broadcast.emit(socketConfig.NOTIFY_ONLINE_USER, { users: socketUsers });
  logs.disconnectLog(socket.handshake.query.groupName, socket.handshake.query.senderId);
};


const notifyUnreadAllGroup = function (group, senderId, socketUsers, onlineUsers, socket, msg, userName = '', type = '') {
  const groupMembersArr = JSON.parse(JSON.stringify(group.groupMembers));
  const index = groupMembersArr.indexOf(senderId);
  if (index > -1) {
    groupMembersArr.splice(index, 1);
  }
  groupMembersArr.forEach(async (userId) => {
    if (Object.keys(socketUsers).includes(userId) && !onlineUsers.includes(userId)) {
      const unreadData = await getUnreadCountByUser(userId, userName, type, senderId, group);
      socket.broadcast.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL, unreadData);
      const dbResult = await allUnreadGlobalCount(userId);
      const responseObj = {};
      if (dbResult.length) responseObj['data'] = dbResult;
      else {
        let userObj = [{ "_id": userId, "count": 0 }];
        responseObj['data'] = userObj;
      }
      socket.broadcast.in(userId).emit(socketConfig.NOTIFY_UNREAD_GLOBAL_COUNT, responseObj);
    }
  });
};


exports.fileNotify = async function (socket, data, groupName, socketUsers) {
  const filename = path.basename(data.name) ? path.basename(data.name) : null;
  group.findOne({ groupName: groupName }).sort({ createdAt: -1 }).then((groups) => {
    const onlineUsers = getOnlineUsers(groupName, data.senderId);
    onlineUsers.push(data.senderId);
    const msg = data.message || 'File Attached';
    const readUserIds = [];

    onlineUsers.forEach(async (ids) => {
      if (groups.groupMembers.includes(ids)) {
        readUserIds.push(ids);
      }
    });


    const chatMessage = new chat({
      groupId: groups._id,
      message: msg,
      fileType: path.extname(filename),
      isFile: true,
      filePath: 'temp/',
      fileName: filename,
      groupName: groupName,
      sendTo: groups.groupMembers,
      senderId: data.senderId,
      type: data.type,
      readUserIds: readUserIds,
    });
    if (data.type == 'group' || (data.type == 'onetoone' && groups.groupMembers.includes(data.senderId))) {
      chatMessage.save();
      chatMessage._doc.userName = data.userName;
      const platform = data.plateform;
      if (platform === 'web') {
        logs.fileUploadLog(groupName, data.senderId, filename);
        aws.fileUpload(chatMessage.fileName, groupName).then((finalRes) => { });
      }
      groupChatMessageUpdateFind(groups._id, msg)
      socket.broadcast.in(groupName).emit(socketConfig.RECEIVED, chatMessage);
      socket.emit(socketConfig.RECEIVED, chatMessage);
      notifyUnreadAllGroup(groups, data.senderId, socketUsers, onlineUsers, socket, msg, data.userName, data.type);
    }
  });
};


const getUnreadCountByUser = async function (userId, userName, type, senderId, groups, broadcast = false) {
  const groupIds = await group.find({ _id: groups._id, groupMembers: { $in: [userId] } }).distinct('groupName');
  let where = {};
  if (broadcast) {
    where = { isDeleted: false, groupName: { $in: groupIds }, readUserIds: { $nin: [userId] }, sendTo: { $in: [userId] } };
  } else {
    where = { isDeleted: false, groupName: { $in: groupIds }, readUserIds: { $nin: [userId] }, senderId: { $nin: [userId] }, sendTo: { $in: [userId] } };
  }
  const dbResult = await chat.aggregate([
    {
      '$match': where,
    },
    {
      '$sort': { 'updatedAt': -1 },
    },
    {
      '$project': {
        'groupName': 1,
        'message': 1,
        'updatedAt': 1,
        'groupId': 1,
        'isFile': 1,
      },
    },
    {
      '$group': {
        '_id': '$groupName',
        'groupName': { '$first': '$groupName' },
        'groupId': { '$first': '$groupId' },
        'message': { '$first': '$message' },
        'updatedAt': { '$first': '$updatedAt' },
        'userName': { '$first': userName },
        'senderId': { '$first': senderId },
        'type': { '$first': type },
        'count': { $sum: 1 },
        'isFile': { '$first': '$isFile' },
      },
    },
  ]);
  return dbResult;
};

exports.sanitize = function (string) {
  const replaceText = string.replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<\/style>/gm, '')
    .replace(/<style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<\/script>/gm, '')
    .replace(/<script\/>/gm, '')
    .replace(/<script>/gm, '')
    .replace(/<html>/gm, '')
    .replace(/<\/html>/gm, '')
    .replace(/<p.*>/gi, '')
    .replace(/<\/p>/gm, '')
    .replace(/<a.*href="(.*?)".*>/gi, '')
    .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '')
    .replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, '')
    .replace(/([\r\n]+ +)+/gm, '')
    .replace(/&nbsp;/gi, '');
  return replaceText;
};
