
const middleware = require('../../middleware/middleware');
const { chatList,
    userList,
    downloadChatFile,
    clearChat,
    deleteMultipleImage,
    allImages
} = require("./validator")
const auth = require('../../services/auth');

const { chatListController, chatGroupListController, downloadFile, 
    clearChatController, downloadMultipleImageController,
    allImageController
} = require("./controller")
module.exports = (app) => {
    app.get('/chat/list', auth(true), middleware(chatList), chatListController);
    app.post('/group/list', auth(true), middleware(userList), chatGroupListController);
    app.post('/download/file', auth(), middleware(downloadChatFile), downloadFile);
    app.post('/clear/chat', auth(),middleware(downloadChatFile), clearChatController);
    app.post('/all/images', auth(true), middleware(allImages), allImageController);
    app.post('/images/delete', auth(),middleware(deleteMultipleImage), downloadMultipleImageController);
}
