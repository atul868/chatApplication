const { perPage } = require("../../../config");
const { userIdData } = require("../Users/dbQuery");
const group = require("./schema");
const { ObjectId } = require('mongoose').Types;
const moment = require("moment")

module.exports.groupCreate = async (req) => {
    return await group.create(req);
}
module.exports.groupFind = async (req) => {
    return await group.findOne(req);
}

module.exports.groupFindUpdate = async (name) => {
    return await group.findOneAndUpdate(
        { groupName: name },
        { $set: { isBlocked: true } },
        { returnOriginal: false }
    );
}


module.exports.groupDetailsUpdate = async (data) => {
    return await group.findOneAndUpdate({
        _id: ObjectId(data._id)
    }, { $set: { ...data } }, { new: true }).lean();
}

module.exports.groupUpdate = async (data) => {
    return await group.findOneAndUpdate(
        { $and: [{ _id: data.groupId }, { groupMembers: { $nin: [data.memberId] } }] },
        { $push: { groupMembers: data.memberId } },
        { new: true })
}

module.exports.groupRemoveUpdate = async (data) => {
    return await group.findOneAndUpdate(
        { $and: [{ _id: data.groupId }, { groupMembers: { $in: [data.memberId] } }] },
        { $pull: { groupMembers: data.memberId } },
        { upsert: false })
}

module.exports.groupMute = async (data) => {
    return await group.findOneAndUpdate(
        { _id: ObjectId(data._id) },
        { $push: { muteUsers: data.userId } },
        { new: true })
}

module.exports.groupUnmute = async (data) => {
    return await group.findOneAndUpdate(
        { _id: ObjectId(data._id) },
        { $pull: { muteUsers: data.userId } },
        { new: true })
}


module.exports.groupFindAll = async (req) => {
    return await group.find(req);
}


module.exports.groupChatMessageUpdateFind = async (id, message = null) => {
    return await group.findOneAndUpdate({
        _id: ObjectId(id)
    }, {
        $set: {
            last_message: {
                send_At: new Date(),
                message: message ? message : ''

            }
        }
    }, { new: true }).lean();
}


module.exports.updateUserData = async (userId, page, perPageRecord) => {
    const pageRecord = perPageRecord ? perPageRecord : perPage;
    return await group.aggregate([
        {
            '$match': {
                'groupMembers': {
                    '$in': [
                        userId
                    ]
                },
                isDeleted: false
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'groupMembers',
                'foreignField': 'userId',
                'as': 'userData'
            }
        },
        {
            '$lookup': {
                'from': 'messages',
                'localField': '_id',
                'foreignField': 'groupId',
                'as': 'chatMessage'
            }
        }, {
            '$unwind': {
                'path': '$chatMessage',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$group': {
                '_id': '$_id',
                'chatId': {
                    '$last': '$chatMessage._id'
                },
                'sendTo': {
                    '$last': '$chatMessage.sendTo'
                },
                'readUserIds': {
                    '$last': '$chatMessage.readUserIds'
                },
                'chatSenderId': {
                    '$last': '$chatMessage.senderId'
                },
                'groupName': {
                    '$last': '$groupName'
                },
                'groupMembers': {
                    '$last': '$groupMembers'
                },
                'type': {
                    '$last': '$type'
                },
                'senderId': {
                    '$last': '$senderId'
                },
                'removedUsers': {
                    '$last': '$removedUsers'
                },
                'addedUsers': {
                    '$last': '$addedUsers'
                },
                'status': {
                    '$last': '$status'
                },
                'adminMembers': {
                    '$last': '$adminMembers'
                },
                'isDeleted': {
                    '$last': '$isDeleted'
                },
                'isBlocked': {
                    '$last': '$isBlocked'
                },
                'profile_img': {
                    '$last': '$profile_img'
                },
                'message': {
                    '$last': '$last_message.message'
                },
                'send_At': {
                    '$last': '$last_message.send_At'
                },
                'createdAt': {
                    '$last': '$createdAt'
                },
                'updatedAt': {
                    '$last': '$updatedAt'
                },
                'chatUpdatedId': {
                    '$last': '$chatMessage.updatedAt'
                },
                'userData': {
                    '$last': '$userData'
                },
                'muteUsers': {
                    '$last': '$muteUsers'
                }
            }
        }, {
            '$sort': { 'chatUpdatedId': -1 }
        }, {
            '$project': {
                '_id': 1,
                'chatId': 1,
                'sendTo': 1,
                'readUserIds': 1,
                'chatSenderId': 1,
                'groupName': 1,
                'groupMembers': 1,
                'type': 1,
                'senderId': 1,
                'removedUsers': 1,
                'addedUsers': 1,
                'status': 1,
                'adminMembers': 1,
                'isDeleted': 1,
                'isBlocked': 1,
                'profile_img': 1,
                'message': 1,
                'send_At': 1,
                'createdAt': 1,
                'updatedAt': 1,
                'userData': 1,
                'muteUsers': 1
            }
        },
        { '$skip': pageRecord * page },
        { '$limit': pageRecord },
    ])
}


module.exports.groupDelete = async (data) => {
    return await group.findByIdAndDelete(data._id)
}

module.exports.groupDetailsBasedOnId = async (_id) => {
    return await group.aggregate(
        [
            {
                '$match': {
                    '_id': new ObjectId(_id)
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'groupMembers',
                    'foreignField': 'userId',
                    'as': 'userData'
                }
            }, {
                '$sort': {
                    'last_message.send_At': -1
                }
            }, {
                '$project': {
                    '_id': 1,
                    'groupName': 1,
                    'groupMembers': 1,
                    'type': 1,
                    'senderId': 1,
                    'removedUsers': 1,
                    'addedUsers': 1,
                    'status': 1,
                    'adminMembers': 1,
                    'isDeleted': 1,
                    'isBlocked': 1,
                    'message': '$last_message.message',
                    'send_At': '$last_message.send_At',
                    'createdAt': 1,
                    'updatedAt': 1,
                    'userData': 1,
                    'muteUsers': 1,
                    'profile_img': 1
                }
            }
        ]
    )
}


/* Keeping Old Query for Refrence  */

// [
//     {
//         '$match': {
//             'groupMembers': {
//                 '$in': [
//                     '327'
//                 ]
//             },
//             'isDeleted': false,
//             'isBlocked': false
//         }
//     }, {
//         '$lookup': {
//             'from': 'users',
//             'localField': 'groupMembers',
//             'foreignField': 'userId',
//             'as': 'userData'
//         }
//     }, {
//         '$sort': {
//             'last_message.send_At': -1
//         }
//     }, {
//         '$lookup': {
//             'from': 'messages',
//             'localField': '_id',
//             'foreignField': 'groupId',
//             'as': 'chatMessage'
//         }
//     }, {
//         '$unwind': {
//             'path': '$chatMessage',
//             'preserveNullAndEmptyArrays': true
//         }
//     }, {
//         '$group': {
//             '_id': '$_id',
//             'chatId': {
//                 '$last': '$chatMessage._id'
//             },
//             'sendTo': {
//                 '$last': '$chatMessage.sendTo'
//             },
//             'readUserIds': {
//                 '$last': '$chatMessage.readUserIds'
//             },
//             'groupName': {
//                 '$last': '$groupName'
//             },
//             'groupMembers': {
//                 '$last': '$groupMembers'
//             },
//             'type': {
//                 '$last': '$type'
//             },
//             'senderId': {
//                 '$last': '$senderId'
//             },
//             'removedUsers': {
//                 '$last': '$removedUsers'
//             },
//             'addedUsers': {
//                 '$last': '$addedUsers'
//             },
//             'status': {
//                 '$last': '$status'
//             },
//             'adminMembers': {
//                 '$last': '$adminMembers'
//             },
//             'isDeleted': {
//                 '$last': '$isDeleted'
//             },
//             'isBlocked': {
//                 '$last': '$isBlocked'
//             },
//             'profile_img': {
//                 '$last': '$profile_img'
//             },
//             'message': {
//                 '$last': '$last_message.message'
//             },
//             'send_At': {
//                 '$last': '$last_message.send_At'
//             },
//             'createdAt': {
//                 '$last': '$createdAt'
//             },
//             'updatedAt': {
//                 '$last': '$updatedAt'
//             },
//             'userData': {
//                 '$last': '$userData'
//             }
//         }
//     }, {
//         '$project': {
//             '_id': 1,
//             'chatId': 1,
//             'sendTo': 1,
//             'readUserIds': 1,
//             'groupName': 1,
//             'groupMembers': 1,
//             'type': 1,
//             'senderId': 1,
//             'removedUsers': 1,
//             'addedUsers': 1,
//             'status': 1,
//             'adminMembers': 1,
//             'isDeleted': 1,
//             'isBlocked': 1,
//             'profile_img': 1,
//             'message': 1,
//             'send_At': 1,
//             'createdAt': 1,
//             'updatedAt': 1,
//             'userData': 1
//         }
//     }
// ]