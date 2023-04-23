const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {
        type: String,
        unique: true
    },
    uuid: {
        type: String,
        unique: true
    },
    user_type: {
        type: String,
    },
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    full_name: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    mobile_number: {
        type: String
    },
    avatar: {
        type: String,
        default: null
    },
    dob: {
        type: Date
    },
    status: {
        type: Boolean,
        enum : [true, false],
        default: true
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    device_type:{
        type: String,
        enum : ['android','iphone','web','Iphone','ios'],
    },
    device_id:{
        type: String
    },
    userToken: {
        type: String,
        default: null
    },
    last_seen:{
        type: Date,
        default: ''
    },
}, {
    timestamps: true
}
)
const user = mongoose.model("users", userSchema);
module.exports = user;