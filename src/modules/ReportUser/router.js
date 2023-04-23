const middleware = require('../../middleware/middleware');
const { reportUser, reportUpdateUser, reportedUserId, allReportedUser
} = require("./validator")
const { reportUserController,
    reportUserUpdateController,
    allReportedUserController,
    reportedUserDetailsController,
    reportedBlockUserController
} = require("./controller")
const auth = require('../../services/auth');
module.exports = (app) => {
    app.post('/create/report', auth(), middleware(reportUser), reportUserController)
    app.patch('/update/report', auth(), middleware(reportUpdateUser), reportUserUpdateController)
    app.post('/list/reported/user', auth(), middleware(allReportedUser), allReportedUserController)
    app.post('/reported/user/details', auth(), middleware(reportedUserId), reportedUserDetailsController)
    app.post('/reported/block/user', auth(),middleware(reportedUserId),reportedBlockUserController )
}