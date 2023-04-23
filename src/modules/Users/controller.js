const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const { userCreate,
    userUpdate,
    userData,
    userName,
    userAll
} = require("./dbQuery")

exports.createUserController = async (req, res) => {
    try {
        const Response = await userCreate({
            ...req.body, ...{
                userId: req.body.userId.toString()
            }
        });
        if (Response) return res.json(success(200, serverResponseMessage.USER_CREATED, Response));
        else return res.json(success(204, serverResponseMessage.FAILURE_DATA_CREATE, err));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};


exports.updateUserController = async (req, res) => {
    try {
        const Response = await userUpdate(req.body);
        if (Response) return res.json(success(200, serverResponseMessage.USER_UPDATED, Response));
        else return res.json(success(204, serverResponseMessage.FAILURE_DATA_UPDATE));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.profileUserController = async (req, res) => {
    try {
        const Response = await userData(req.body);
        if (Response.last_seen == null) {
            Response.last_seen = ''
        }
        if (Response) return res.json(success(200, serverResponseMessage.USER_FETCH, Response));
        else return res.json(success(204, serverResponseMessage.DATA_READ_ERROR));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.profileUserListController = async (req, res) => {
    try {
        const name = req.body.name ? req.body.name : undefined;
        let Response
        if (name) Response = await userName(name);
        else Response = await userAll();
        if (Response) return res.json(success(200, serverResponseMessage.USER_FETCH, Response));
        else return res.json(success(204, serverResponseMessage.DATA_READ_ERROR));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};

exports.blockUserController = async (req, res) => {
    try {
        const Response = await userUpdate(req.body)
        if (Response) return res.json(success(200, serverResponseMessage.USER_BLOCK_STATUS, Response));
        else return res.json(success(204, serverResponseMessage.DATA_READ_ERROR));
    } catch (error) {
        return res.json(
            failure(204, serverResponseMessage.ERROR, error.message)
        );
    }
};