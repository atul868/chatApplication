const joi = require('joi');

exports.chatList = joi.object({
    uniqueId: joi.string().required(),
    userId: joi.number().required(),
    perPage: joi.number().optional(),
    page: joi.number().optional(),
    keepdate: joi.boolean().optional(),
});

exports.userList = joi.object({
    userId: joi.number().required(),
    perPage: joi.number().optional(),
    page: joi.number().optional(),
    userName: joi.string().optional(),
});

exports.downloadChatFile = joi.object({
    id: joi.string().optional(),
    groupName: joi.string().optional(),
    fileName: joi.string().optional(),
});

exports.clearChat = joi.object({
    _id: joi.string().hex().length(24).required(),
});

exports.allImages = joi.object({
    _id: joi.string().hex().length(24).required(),
    userId: joi.string().required(),
});

exports.deleteMultipleImage = joi.object({
    imagesKeys: joi.array().required(),
});