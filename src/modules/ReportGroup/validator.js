const joi = require('joi');


exports.reportGroup = joi.object({
    reported_id: joi.string().hex().length(24).required(),
    reportedGroup_id: joi.string().hex().length(24).required(),
    status: joi.boolean().optional(),
    comment: joi.string().optional(),
})

exports.reportUpdateUser = joi.object({
    _id: joi.string().hex().length(24).required(),
    reported_id: joi.string().hex().length(24).optional(),
    reportedBy_id: joi.string().hex().length(24).optional(),
    status: joi.boolean().optional(),
    comment: joi.string().optional(),
})

exports.reportedGroupId = joi.object({
    reportedGroup_id: joi.string().hex().length(24).required(),
});

exports.allReportedUser =  joi.object({
    perPage: joi.number().optional(),
    page: joi.number().required(),
    groupName: joi.string().optional(),
    sortFields : joi.object().optional()
});
