const joi = require('joi');


exports.reportUser = joi.object({
    reported_id: joi.string().hex().length(24).required(),
    reportedBy_id: joi.string().hex().length(24).required(),
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

exports.reportedUserId = joi.object({
    reported_id: joi.string().hex().length(24).required(),
});

exports.allReportedUser =  joi.object({
    perPage: joi.number().optional(),
    page: joi.number().required(),
    reportedBy_username: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).optional(),
    sortFields : joi.object().optional()
});
