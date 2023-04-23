const reports = require("./schema");
const { ObjectId } = require('mongoose').Types;
const { perPageRecord } = require("../../../config");
RegExp.escape = function (s) {
    return s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports.reportCreate = async (req) => {
    return await reports.create(req);
}

module.exports.reportUpdate = async (req, Id) => {
    const id = Id ? Id : req._id
    return await reports.findOneAndUpdate({
        _id: ObjectId(id)
    }, { $set: { ...req } }, { new: true }).lean();
}

module.exports.reportedAll = async ({ page, perPage, reportedBy_username, sortFields }) => {
    const perPageTotal = perPage ? perPage : perPageRecord;
    let whereArr = {};
    let sortObject = {}
    if (reportedBy_username)
        (whereArr['reportedBy_username'] = { $regex: new RegExp(RegExp.escape(reportedBy_username), 'i') });
    if (sortFields && Object.keys(sortFields).length) sortObject = sortFields

    return await reports.aggregate(
        [
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'reportedBy_id',
                    'foreignField': '_id',
                    'as': 'users'
                }
            }, {
                '$unwind': {
                    'path': '$users',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$group': {
                    '_id': '$reportedBy_id',
                    'count': {
                        '$sum': 1
                    },
                    'reportedBy_username': {
                        '$first': '$users.full_name'
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

module.exports.reportedUserDetails = async (id) => {
    return await reports.aggregate(
        [
            {
                '$match': {
                    'reportedBy_id': new ObjectId(id)
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'reportedBy_id',
                    'foreignField': '_id',
                    'as': 'reportedBy'
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'reported_id',
                    'foreignField': '_id',
                    'as': 'reported'
                }
            }, {
                '$unwind': {
                    'path': '$reportedBy',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$unwind': {
                    'path': '$reported',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$project': {
                    '_id': 1,
                    'reported_id': 1,
                    'reportedBy_id': 1,
                    'status': 1,
                    'comment': 1,
                    'createdAt': 1,
                    'reportedBy_userName': '$reportedBy.full_name',
                    'reported_userName': '$reported.full_name'
                }
            }
        ]
    )
}


module.exports.getAllRecord = async ({ reportedBy_username, sortFields }) => {
    let whereArr = {};
    let sortObject = {}
    if (reportedBy_username)
        (whereArr['reportedBy_username'] = { $regex: new RegExp(RegExp.escape(reportedBy_username), 'i') });
    if (sortFields && Object.keys(sortFields).length) sortObject = sortFields

    return await reports.aggregate(
        [
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'reportedBy_id',
                    'foreignField': '_id',
                    'as': 'users'
                }
            }, {
                '$unwind': {
                    'path': '$users',
                    'preserveNullAndEmptyArrays': false
                }
            }, {
                '$group': {
                    '_id': '$reportedBy_id',
                    'count': {
                        '$sum': 1
                    },
                    'reportedBy_username': {
                        '$first': '$users.full_name'
                    }
                }
            }, {
                '$match': whereArr
            }, {
                '$sort': sortObject
            }
        ])
}

module.exports.isAlreadyBlocked = async ({ reported_id, reportedBy_id }) => {
    return await reports.find({
        reported_id: reported_id,
        reportedBy_id: reportedBy_id
    })
}


module.exports.reportedBlockUserDetails = async ({ reported_id }) => {
    return await reports.aggregate([
        {
            '$match': {
                'reported_id': new ObjectId(reported_id)
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'reportedBy_id',
                'foreignField': '_id',
                'as': 'reportedByuserData'
            }
        }, {
            '$unwind': {
                'path': '$reportedByuserData',
                'preserveNullAndEmptyArrays': false
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'reported_id',
                'foreignField': '_id',
                'as': 'reportedUserData'
            }
        }, {
            '$unwind': {
                'path': '$reportedUserData',
                'preserveNullAndEmptyArrays': false
            }
        }, {
            '$addFields': {
                'groupName': {
                    '$concat': [
                        '$reportedByuserData.userId', '-', '$reportedUserData.userId'
                    ]
                }
            }
        }
    ])
}

module.exports.deleteReportUser = async ({ reported_id }) => {
    return await reports.deleteMany({
        reported_id: reported_id
    })
}