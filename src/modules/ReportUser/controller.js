const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const { reportCreate, reportUpdate,
    reportedAll, reportedUserDetails,
    getAllRecord, isAlreadyBlocked,
    reportedBlockUserDetails,
    deleteReportUser
} = require("./dbQuery");
const { userData } = require("../Users/dbQuery");
const { groupFindUpdate } = require("../Groups/dbQuery");
const socketConfig = require('../../../config/socket');

exports.reportUserController = async (req, res) => {
    try {
        const isRepoertedUserExist = await userData({ _id: req.body.reported_id })
        const isRepoertedByUserExist = await userData({ _id: req.body.reportedBy_id })
        if (isRepoertedUserExist._id && isRepoertedByUserExist._id) {
            const isAlreadyBlockedUser = await isAlreadyBlocked(req.body);
            if (isAlreadyBlockedUser.length) {
                return res.json(failure(400, serverResponseMessage.USER_REPORTED_ALREADY, {}));
            } else {
                const Response = await reportCreate(req.body)
                return res.json(success(200, serverResponseMessage.USER_REPORTED, Response));
            }
        }
        else return res.json(success(204, serverResponseMessage.DATA_READ_ERROR));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.reportUserUpdateController = async (req, res) => {
    try {
        const Response = await reportUpdate(req.body);
        if (Response) return res.json(success(200, serverResponseMessage.USER_REPORTED_UPDATE, Response));
        else return res.json(success(204, serverResponseMessage.FAILURE_DATA_UPDATE));
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
        const Response = await reportedAll(req.body);
        if (Response) {
            const responseObj = {};
            responseObj['data'] = Response;
            responseObj['totalpage'] = Math.ceil(totalCount.length / perPage);
            responseObj['totalRecord'] = Math.ceil(totalCount.length);
            responseObj['perpage'] = perPage;
            return res.json(success(200, serverResponseMessage.ALL_USER_REPORTED, responseObj));
        }
        else return res.json(success(204, serverResponseMessage.FAILURE_DATA_UPDATE));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.reportedUserDetailsController = async (req, res) => {
    try {
        const Response = await reportedUserDetails(req.body.reported_id);
        if (Response) {
            const responseObj = {};
            responseObj['data'] = Response;
            return res.json(success(200, serverResponseMessage.REPORTED_USER_DETAILS, responseObj));
        }
        else return res.json(success(204, serverResponseMessage.FAILURE_DATA_UPDATE));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};
exports.reportedBlockUserController = async (req, res) => {
    try {
        const Response = await reportedBlockUserDetails(req.body);
        if (Response.length) {
            for (let i = 0; i < Response.length; i++) {
                const groupName = Response[i].groupName;
                let sorGroupName;
                const [first, second] = groupName.split("-");
                const isSorted = Number(first) <= Number(second);
                if (isSorted) sorGroupName = groupName;
                else sorGroupName = groupName.split("-").reverse().join("-");
                const groupData = await groupFindUpdate(sorGroupName);
                if (groupData && groupData != null) {
                    global.globalSocket.emit(socketConfig.BLOCK_USER, groupData);
                }
            }
            await deleteReportUser(req.body)
            const responseObj = {};
            responseObj['data'] = Response;
            return res.json(success(200, serverResponseMessage.REPORTED_USER_BLOCK_DETAILS, {}));
        }
        else return res.json(success(204, serverResponseMessage.NO_RECORD_FOUND));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};