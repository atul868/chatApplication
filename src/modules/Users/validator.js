const joi = require('joi');

exports.createUser = joi.object({
    userId: joi.number().required(),
    uuid: joi.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).required(),
    user_type: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required(),
    first_name: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required(),
    last_name: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).optional(),
    full_name: joi.string().regex(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/).required(),
    email: joi.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).email().required(),
    mobile_number: joi.string().regex(/^\+?[1-9]\d{1,14}$/).min(10).required(),
    avatar: joi.string().optional(),
    dob: joi.date().optional(),
    status: joi.boolean().required(),
    device_type: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required(),
    device_id: joi.string().optional() 
})


exports.updateUser = joi.object({
    _id: joi.string().hex().length(24).required(),
    first_name: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).required(),
    last_name: joi.string().regex(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/).optional(),
    full_name: joi.string().regex(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/).required(),
    email: joi.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).email().optional(),
    mobile_number: joi.string().regex(/^\+?[1-9]\d{1,14}$/).min(10).required(),
    avatar: joi.string().optional(),
    dob: joi.date().optional(),
    status: joi.boolean().optional(),
    device_type: joi.string().optional(),
    device_id: joi.string().optional() 
})

exports.getUser = joi.object({
    _id: joi.string().hex().length(24).required(),
})

exports.blockUser = joi.object({
    _id: joi.string().hex().length(24).required(),
    is_blocked: joi.boolean().required()
})

exports.getUserList = joi.object({
    name : joi.string().regex(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/).optional(),
})

