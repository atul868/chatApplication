const middleware = require('../../middleware/middleware');
const { createUser,
    updateUser,
    getUser,
    getUserList,
    blockUser
} = require("./validator")
const { createUserController,
    updateUserController,
    profileUserController,
    profileUserListController,
    blockUserController
} = require("./controller");

const auth = require('../../services/auth');
module.exports = (app) => {
    app.post('/create/user', middleware(createUser), createUserController);
    app.patch('/update/user', auth(), middleware(updateUser), updateUserController);
    app.post('/get/profile', auth(), middleware(getUser), profileUserController);
    app.post('/user/list', auth(), middleware(getUserList), profileUserListController);
    app.post('/block/user', auth(), middleware(blockUser), blockUserController)
}