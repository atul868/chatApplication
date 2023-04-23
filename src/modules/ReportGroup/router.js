const middleware = require('../../middleware/middleware');
const { reportGroup, reportedGroupId, reportedUserId, allReportedUser
} = require("./validator")
const { reportGroupController,
    clearReportGroupController,
    allReportedUserController,
    reportedGroupDetailsController,
    
} = require("./controller")
const auth = require('../../services/auth');
module.exports = (app) => {
    app.post('/create/group/report', auth(), middleware(reportGroup), reportGroupController)
    app.delete('/clear/group/report', auth(), middleware(reportedGroupId), clearReportGroupController)
    app.post('/list/reported/group', auth(), middleware(allReportedUser), allReportedUserController)
    app.post('/reported/group/details', auth(), middleware(reportedGroupId), reportedGroupDetailsController)
}