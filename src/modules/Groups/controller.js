const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const { groupCreate, groupFind, groupUpdate, groupRemoveUpdate,
    groupDetailsUpdate, groupDelete, groupChatMessageUpdateFind, groupDetailsBasedOnId, groupMute, groupUnmute
} = require("./dbQuery")
const socketConfig = require('../../../config/socket');
const moment = require('moment');
const { userFind } = require("../Users/dbQuery");
const { findAllImages, clearChatMessages, findAllImagesInChat } = require("../Chat/dbQuery");
const aws = require('../../../src/services/aws');

exports.createGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            groupName: req.body.groupName
        });
        if (!groupResponse) {
            if (req.body.groupMembers.length >= 2) {
                const grpCreateRes = await groupCreate({
                    ...req.body
                });
                for (const member of req.body.adminMembers) {
                    for (const members of req.body.groupMembers) {
                        grpCreateRes.addedUsers.set(members.toString(), [moment.utc(new Date())]);
                    }
                }
                await grpCreateRes.save();
                if (grpCreateRes) return res.json(success(200, serverResponseMessage.GROUP_CREATED, grpCreateRes));
                else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_CREATE, err));
            } else return res.json(failure(400, serverResponseMessage.ATLEAST_TWO_MEMBERS_REQUIRED, {}));
        } else return res.json(failure(400, serverResponseMessage.GROUP_ALREADY_CREATED));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.getGroupController = async (req, res) => {
    try {
        let whereArr = {}
        if (req.body._id) {
            whereArr['_id'] = req.body._id
        } else whereArr['groupName'] = req.body.groupName
        const groupResponse = await groupFind(whereArr);
        if (groupResponse) {
            const grpGetRes = await groupDetailsBasedOnId(groupResponse._id)
            if (grpGetRes) return res.json(success(200, serverResponseMessage.GROUP_FETCH, grpGetRes[[0]]));
            else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_GET, err));
        } else return res.json(success(200, serverResponseMessage.GROUP_DOES_NOT_EXSIST,groupResponse));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.updateGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body._id
        });
        if (groupResponse) {
            const grpUpdateRes = await groupDetailsUpdate(req.body);
            if (grpUpdateRes) return res.json(success(200, serverResponseMessage.GROUP_UPDATED, grpUpdateRes));
            else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_CREATE, err));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.blockGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body._id
        });
        if (groupResponse && groupResponse.type == 'onetoone') {
            if (!req.body.isBlocked && (groupResponse.block_userId == req.body.userId)) {
                const grpUpdateRes = await groupDetailsUpdate({
                    ...req.body,
                    block_userId: ""
                });
                if (grpUpdateRes) {
                    global.globalSocket.emit(socketConfig.UNBLOCK_USER, grpUpdateRes);
                    return res.json(success(200, serverResponseMessage.GROUP_BLOCK, grpUpdateRes));
                }
                else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_UPDATE, err));
            }
            if (req.body.isBlocked) {
                delete req.body.block_userId
                const grpUpdateRes = await groupDetailsUpdate({
                    ...req.body,
                    block_userId: req.body.userId
                });
                if (grpUpdateRes){
                    global.globalSocket.emit(socketConfig.BLOCK_USER, grpUpdateRes);
                    return res.json(success(200, serverResponseMessage.GROUP_BLOCK, grpUpdateRes));
                } 
                else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_UPDATE, err));
            }
            else return res.json(failure(204, serverResponseMessage.MISMATCH_DATA, {}));
        } else return res.json(failure(400, serverResponseMessage.GROUP_BLOCK_UNABLE));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.deleteGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body._id
        });
        if (groupResponse) {
            const grpDeleteRes = await groupDelete(groupResponse);
            const findImagesChat = await findAllImagesInChat(grpDeleteRes.groupName);
            if (findImagesChat.length) {
                await aws.deleteMultipleImages(findImagesChat[0].imagesKeys)
            }
            await clearChatMessages(grpDeleteRes.groupName);
            if (grpDeleteRes) return res.json(success(200, serverResponseMessage.GROUP_DELETE, grpDeleteRes));
            else return res.json(failure(204, serverResponseMessage.FAILURE_DATA_CREATE, err));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};


exports.addGroupMemberController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body.groupId
        });
        if (groupResponse && groupResponse.adminMembers.includes(req.body.loggedInUserId) &&
            groupResponse.type == 'group') {
            const { memberId } = req.body;
            for (let i = 0; i < memberId.length; i++) {
                if (!groupResponse.groupMembers.includes(memberId[i])) {
                    const AddNewMembersIntoGrp = await groupUpdate({
                        ...req.body,
                        memberId: memberId[i]
                    });
                    AddNewMembersIntoGrp.removedUsers.set(memberId[i].toString(), undefined, { strict: false });
                    const values = Object.keys(JSON.parse(JSON.stringify(AddNewMembersIntoGrp.addedUsers)));
                    if (!values.includes(memberId[i])) {
                        AddNewMembersIntoGrp.addedUsers.set(memberId[i].toString(), [moment.utc(new Date())]);
                    }
                    await AddNewMembersIntoGrp.save();
                }
            }
            const newgroupResponse = await groupFind({
                _id: req.body.groupId
            });
            if (newgroupResponse) {
                global.globalSocket.emit(socketConfig.ADDED_USER, newgroupResponse);
                return res.json(success(200, serverResponseMessage.GROUP_MEMBER_ADDED, newgroupResponse));
            }
            else return res.json(success(204, serverResponseMessage.FAILURE_DATA_CREATE));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};
exports.removeGroupMemberController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body.groupId
        });
        if (groupResponse && groupResponse.groupMembers.includes(req.body.memberId) && groupResponse.type == 'group') {
            const RemMembersFromGrp = await groupRemoveUpdate(req.body);
            const userResponse = await userFind({ userId: req.body.memberId });
            RemMembersFromGrp.removedUsers.set(req.body.memberId.toString(), [new Date(), userResponse.full_name, userResponse.avatar]);
            await RemMembersFromGrp.save();
            global.globalSocket.emit(socketConfig.REMOVED_USER, RemMembersFromGrp);
            return res.json(success(200, serverResponseMessage.GROUP_MEMBER_REMOVED, RemMembersFromGrp));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.muteGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body._id
        });
        if (groupResponse && groupResponse.groupMembers.includes(req.body.userId) && (!groupResponse.muteUsers.includes(req.body.userId))) {
            const muteGrpResponse = await groupMute(req.body);
            return res.json(success(200, serverResponseMessage.MUTE_MESSAGE, muteGrpResponse));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.unMuteGroupController = async (req, res) => {
    try {
        const groupResponse = await groupFind({
            _id: req.body._id
        });
        if (groupResponse && groupResponse.groupMembers.includes(req.body.userId) && (groupResponse.muteUsers.includes(req.body.userId))) {
            const unMuteGrpResponse = await groupUnmute(req.body);
            return res.json(success(200, serverResponseMessage.UNMUTE_MESSAGE, unMuteGrpResponse));
        } else return res.json(failure(400, serverResponseMessage.GROUP_NOT_EXSIST));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};