const middleware = require('../../middleware/middleware');
const { createGroup, membersAdd, membersRemove, updateGroup, blockGroup, getGroup,muteGroup
} = require("./validator")
const auth = require('../../services/auth');
const { createGroupController, addGroupMemberController, removeGroupMemberController, updateGroupController,
    blockGroupController, deleteGroupController, getGroupController,muteGroupController,unMuteGroupController
} = require("./controller")
module.exports = (app) => {
    app.post('/create/group', auth(), middleware(createGroup), createGroupController);
    app.post('/get/group', auth(), middleware(getGroup), getGroupController);
    app.post('/update/group', auth(), middleware(updateGroup), updateGroupController);
    app.post('/block/group', auth(true), middleware(blockGroup), blockGroupController);
    app.post('/delete/group', auth(), middleware(getGroup), deleteGroupController);
    app.post('/add/groupMember', auth(), middleware(membersAdd), addGroupMemberController);
    app.post('/remove/groupMember', auth(), middleware(membersRemove), removeGroupMemberController);
    app.post('/mute/group', auth(true), middleware(muteGroup), muteGroupController);
    app.post('/unmute/group', auth(true), middleware(muteGroup), unMuteGroupController);
}