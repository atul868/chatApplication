const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const chat = require("./schema");
const group = require("../Groups/schema");
const moment = require('moment');


module.exports.chatUpdate = async (data) => {
    const changes = {
        $push: { readUserIds: data.senderId },
    };
    return await chat.updateMany({ groupName: data.groupName, readUserIds: { $nin: [data.senderId] }, sendTo: { $in: [data.senderId] } }, changes);
}


module.exports.chatListData = async (whereArrChat) => {
    return await chat.aggregate([
        { '$match': whereArrChat },
        { '$sort': { 'updatedAt': -1 } },
        {
            '$project': {
                'groupName': 1,
                'message': 1,
            },
        },
        {
            '$group': {
                '_id': '$groupName',
                'message': { '$first': '$message' },
                'count': { $sum: 1 },
            },
        },
    ]);
}


module.exports.chatList = async (whereArr, perPage, page) => {
    return await chat.aggregate([
        {
            '$match': whereArr
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'senderId',
                'foreignField': 'userId',
                'as': 'userData'
            }
        }, {
            '$unwind': {
                'path': '$userData',
                'preserveNullAndEmptyArrays': false
            }
        }, {
            '$sort': {
                'createdAt': -1
            }
        },
        { '$skip': perPage * page },
        { '$limit': perPage },
    ])
}
// module.exports.chatList = async (req, res, whereArr, perPage, page) => {
//     chat.countDocuments(whereArr, function (err, count) {
//         chat.find(whereArr, {}, { skip: perPage * page, limit: perPage })
//             .sort({
//                 createdAt: -1,
//             }).then((chats) => {
//                 let results = {};
//                 // if (!req.query.keepdate) {
//                 if (false) {
//                     for (let i = (chats.length - 1); i >= 0; i--) {
//                         const dateKey = moment(chats[i].createdAt).format('MMMM DD YYYY');
//                         if (!results[dateKey]) {
//                             results[dateKey] = [];
//                         }
//                         results[dateKey].push(chats[i]);
//                     }
//                 } else {
//                     results = chats;
//                 }
//                 const responseObj = {};
//                 responseObj['data'] = results;
//                 responseObj['totalpage'] = Math.ceil(count / perPage);
//                 responseObj['perpage'] = perPage;
//                 responseObj['total'] = count;
//                 return res.json(success(200, serverResponseMessage.Group_chat_list, responseObj));
//             });
//     });
// }

module.exports.clearChatMessages = async (groupName) => {
    return await chat.deleteMany({ groupName: groupName });
}

module.exports.unreadChatCount = async (whereArrChat) => {
    return await chat.aggregate([
        { '$match': whereArrChat },
        { '$sort': { 'updatedAt': -1 } },
        {
            '$project': {
                'groupName': 1,
            },
        },
        {
            '$group': {
                '_id': '$groupName',
                'count': { $sum: 1 },
            },
        },
    ]);
}

module.exports.findAllImages = async (imageKeys) => {
    return await chat.find({ 'fileName': { $in: imageKeys } })
}


module.exports.findAllImagesInChat = async (groupName) => {
    return await chat.aggregate([
        {
            '$match': {
                'groupName': groupName,
                'message': 'File Attached'
            }
        }, {
            '$group': {
                '_id': null,
                'imagesKeys': {
                    '$push': '$fileName'
                }
            }
        }
    ])
}


module.exports.allImagesInChat = async (obj) => {
    return await chat.find(obj)
}

module.exports.deleteMultipleImagesChat = async (fileKeys) => {
    return await chat.deleteMany({ fileName: { $in: fileKeys } })
}


module.exports.allUnreadGlobalCount = async (userId) => {
    const groupIds = await group.find({ groupMembers: { $in: [userId] } }).distinct('groupName');
    const whereArrChat = { isDeleted: false, groupName: { $in: groupIds }, readUserIds: { $nin: [userId] }, senderId: { $nin: [userId] }, sendTo: { $in: [userId] } };
    return await chat.aggregate([
        {
            '$match': whereArrChat,
        },
        {
            '$sort': { 'updatedAt': -1 },
        },
        {
            '$project': {
                'groupName': 1,
                'groupId': 1,
                'createdAt': 1,
                'message': 1,
                'readUserIds': 1
            },
        },
        {
            $addFields: { 'userId': userId }
        },
        {
            $lookup: {
                from: 'groups',
                localField: 'groupId',
                foreignField: '_id',
                as: 'groupData',
            },
        }, {
            $unwind: {
                path: '$groupData',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            '$group': {
                '_id': '$userId',
                'count': { $sum: 1 },
                'message': { $first: '$message' },
                'group_id': { $first: '$groupData._id' },
                'readUserIds': { $first: '$groupData.readUserIds' }
            },
        },
    ]);
}