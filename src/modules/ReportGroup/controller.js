const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const { reportGroupCreate,
    reportedGroupDetails,
    getAllRecord,
    isAlreadyReported,
    reportedGroupList,
    reportedGroupDelete,
    reportedGroupAll
} = require("./dbQuery");
const { userData } = require("../Users/dbQuery");
const { groupFind, groupDelete } = require("../Groups/dbQuery");
const { findAllImagesInChat, clearChatMessages } = require("../Chat/dbQuery");
const { aws } = require("../../../config");


exports.reportGroupController = async (req, res) => {
    try {
        const isRepoertedUserExist = await userData({ _id: req.body.reported_id })
        const isRepoertedGroupExist = await groupFind({ _id: req.body.reportedGroup_id })
        if (isRepoertedUserExist._id && isRepoertedGroupExist._id && isRepoertedGroupExist.type == 'group'
            && isRepoertedGroupExist.groupMembers.includes(isRepoertedUserExist.userId)) {
            const isAlreadyReportedGroup = await isAlreadyReported(req.body);
            if (isAlreadyReportedGroup.length) {
                return res.json(failure(400, serverResponseMessage.GROUP_REPORTED_ALREADY, {}));
            } else {
                const Response = await reportGroupCreate(req.body)
                return res.json(success(200, serverResponseMessage.GROUP_REPORTED, Response));
            }
        }
        else return res.json(success(204, serverResponseMessage.DATA_READ_ERROR));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.clearReportGroupController = async (req, res) => {
    try {
        const Response = await reportedGroupList(req.body);
        if (Response.length) {
            const isGroup = await groupFind({ _id: req.body.reportedGroup_id });
            if (isGroup) {
                const findImagesChat = await findAllImagesInChat(isGroup.groupName);
                if (findImagesChat.length) {
                    await aws.deleteMultipleImages(findImagesChat[0].imagesKeys)
                }
                await clearChatMessages(isGroup.groupName);
                await groupDelete(isGroup);
            }
            const deleteGroupReportData = await reportedGroupDelete(req.body);
            if (deleteGroupReportData) return res.json(success(200, serverResponseMessage.GROUP_REPORTED_DELETE, deleteGroupReportData));
            else return res.json(failure(204, serverResponseMessage.GROUP_REPORTED_UNABLE_CLEAR));
        } else return res.json(failure(204, serverResponseMessage.DATA_NOT_MATCHING));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.allReportedUserController = async (req, res) => {
    try {
        const { perPage } = req.body;
        const totalCount = await getAllRecord(req.body);
        const Response = await reportedGroupAll(req.body);
        if (Response) {
            const responseObj = {};
            responseObj['data'] = Response;
            responseObj['totalpage'] = Math.ceil(totalCount.length / perPage);
            responseObj['totalRecord'] = Math.ceil(totalCount.length);
            responseObj['perpage'] = perPage;
            return res.json(success(200, serverResponseMessage.ALL_GROUP_REPORTED, responseObj));
        }
        else return res.json(success(204, serverResponseMessage.DATA_NOT_MATCHING));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.reportedGroupDetailsController = async (req, res) => {
    try {
        const Response = await reportedGroupDetails(req.body.reportedGroup_id);
        if (Response) {
            const responseObj = {};
            responseObj['data'] = Response;
            return res.json(success(200, serverResponseMessage.REPORTED_GROUP_DETAILS, responseObj));
        }
        else return res.json(success(204, serverResponseMessage.DATA_NOT_MATCHING));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};