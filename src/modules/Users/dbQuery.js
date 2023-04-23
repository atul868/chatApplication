const user = require("./schema");
const { ObjectId } = require('mongoose').Types;
RegExp.escape = function(s) {
    return s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

module.exports.userCreate = async (req) => {
    return await user.create(req);
}

module.exports.userUpdate = async (req, Id) => {
    const id = Id ? Id : req._id
    return await user.findOneAndUpdate({
        _id: ObjectId(id)
    }, { $set: { ...req } }, { new: true }).lean();
}

module.exports.userData = async (req) => {
    return await user.findOne({ _id: ObjectId(req._id) }).lean();
}

module.exports.userIdData = async (userId) => {
    return await user.findOne({ userId: userId }).select({full_name: 1});
}

module.exports.userName = async (name) => {
    return await user.find({ full_name: {$regex: new RegExp(RegExp.escape(name), 'i')} });
}

module.exports.userAll = async () => {
    return await user.find({});
}

module.exports.userFind = async (req) => {
    return await user.findOne(req);
}
module.exports.updateUserDetailOnUserId = async(userId, req) =>{
    return await user.findOneAndUpdate({
        userId: userId
    }, { $set: { ...req } }, { new: true }).lean();
}
