const jwt = require('jsonwebtoken');
const config = require('../../config/index');
const { userFind } = require('../modules/Users/dbQuery');

const verifyJWT = (isReq = false) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        const result = token ? token.substr(token.indexOf(' ') + 1) : false;
        if (!result) {
            return res.status(403).send({ 'status': false, 'code': 403, 'message': 'Unauthorized !' });
        }
        jwt.verify(result, config.secret, async function (err, decoded) {
            if (err) {
                return res.status(500).send({ 'status': false, 'code': 500, 'message': 'Failed to authenticate token. !' });
            }
            const { uuid } = decoded;
            const userResponse = await userFind({ uuid: uuid });
            const { userId } = userResponse
            if (isReq) {
                req.body.userId = userId;
            }
            next();

        });
    }
};

module.exports = verifyJWT;