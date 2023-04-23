const reportGroups = require("./schema");
const { ObjectId } = require('mongoose').Types;
const { perPageRecord } = require("../../../config");
RegExp.escape = function (s) {
    return s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports.reportGroupCreate = async (req) => {
    return await reportGroups.create(req);
}


module.exports.isAlreadyReported = async ({ reported_id, reportedGroup_id }) => {
    return await reportGroups.find({
        reported_id: reported_id,
        reportedGroup_id: reportedGroup_id
    })
}

module.exports.reportedGroupList = async ({ reportedGroup_id }) => {
    return await reportGroups.find({
        reportedGroup_id: reportedGroup_id
    })
}

module.exports.reportedGroupDelete = async ({ reportedGroup_id }) => {
    return await reportGroups.deleteMany({
        reportedGroup_id: reportedGroup_id
    })
}

module.exports.reportedGroupAll = async ({ page, perPage, groupName, sortFields }) => {
    const perPageTotal = perPage ? perPage : perPageRecord;
    let whereArr = {};
    let sortObject = {}
    if (groupName)
        (whereArr['groupName'] = { $regex: new RegExp(RegExp.escape(groupName), 'i') });
    if (sortFields && Object.keys(sortFields).length) sortObject = sortFields

    return await reportGroups.aggregate(
        [
            {
                '$lookup': {
                    'from': 'groups',
                    'localField': 'reportedGroup_id',
                    'foreignField': '_id',
                    'as': 'groupData'
                }
            }, {
                '$unwind': {
                    'path': '$groupData',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$group': {
                    '_id': '$reportedGroup_id',
                    'count': {
                        '$sum': 1
                    },
                    'groupName': {
                        '$first': '$groupData.groupName'
                    }
                }
            }, {
                '$match': whereArr
            }, {
                '$sort': sortObject
            },
            { '$skip': perPageTotal * page },
            { '$limit': perPageTotal },
        ])
}



module.exports.reportedGroupDetails = async (id) => {
    return await reportGroups.aggregate(
        [
            {
                '$match': {
                    'reportedGroup_id': new ObjectId(id)
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'reported_id',
                    'foreignField': '_id',
                    'as': 'userData'
                }
            }, {
                '$unwind': {
                    'path': '$userData',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$project': {
                    '_id': 1,
                    'reportedGroup_id': 1,
                    'reported_id': 1,
                    'userName': '$userData.full_name',
                    'userUUID': '$userData.uuid',
                    'comment': 1
                }
            }
        ]
    )
}


module.exports.getAllRecord = async ({ reportedBy_username, sortFields }) => {
    let whereArr = {};
    let sortObject = {}
    if (reportedBy_username)
        (whereArr['groupName'] = { $regex: new RegExp(RegExp.escape(groupName), 'i') });
    if (sortFields && Object.keys(sortFields).length) sortObject = sortFields

    return await reportGroups.aggregate([
        {
            '$lookup': {
                'from': 'groups',
                'localField': 'reportedGroup_id',
                'foreignField': '_id',
                'as': 'groupData'
            }
        }, {
            '$unwind': {
                'path': '$groupData',
                'preserveNullAndEmptyArrays': false
            }
        }, {
            '$group': {
                '_id': '$reportedGroup_id',
                'count': {
                    '$sum': 1
                },
                'groupName': {
                    '$first': '$groupData.groupName'
                }
            }
        }, {
            '$match': whereArr
        }, {
            '$sort': sortObject
        }])
}


