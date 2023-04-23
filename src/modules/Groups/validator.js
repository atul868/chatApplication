const joi = require('joi');

exports.createGroup = joi.object({
    groupName: joi.string().required(),
    groupMembers: joi.array().items(joi.string()).required(),
    senderId: joi.string().required(),
    type: joi.string().required(),
    adminMembers: joi.array().items(joi.string()).optional(),
    profile_img: joi.string().optional()
})

exports.updateGroup = joi.object({
    _id: joi.string().hex().length(24).required(),
    adminMembers: joi.array().items(joi.string()).optional(),
    profile_img: joi.string().optional(),
    groupName: joi.string().optional(),
    isBlocked: joi.string().optional()
})
exports.blockGroup = joi.object({
    _id: joi.string().hex().length(24).required(),
    isBlocked: joi.boolean().required(),
    userId: joi.string().required(),
})

exports.getGroup = joi.object({
    _id: joi.string().hex().length(24).optional(),
    groupName: joi.string().optional()
})


exports.membersAdd = joi.object({
    groupId: joi.string().required(),
    memberId: joi.array().required(),
    loggedInUserId: joi.string().required(),
    deviceToken: joi.array().optional(),
    isAdmin: joi.boolean().optional(),
});

exports.membersRemove = joi.object({
    groupId: joi.string().required(),
    memberId: joi.string().required(),
    deviceToken: joi.array().optional(),
});

exports.muteGroup = joi.object({
    _id: joi.string().hex().length(24).required(),
    userId: joi.string().required(),
})