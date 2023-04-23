const { success, failure } = require("../../utils/response")
const { serverResponseMessage } = require("../../../config/message");
const { updateUserData, groupFind, groupChatMessageUpdateFind, groupFindAll } = require("../Groups/dbQuery");
const { chatList, clearChatMessages, unreadChatCount, findAllImages, findAllImagesInChat, deleteMultipleImages, deleteMultipleImagesChat, allImagesInChat } = require("./dbQuery");
const { perPage } = require("../../../config");
const aws = require('../../../src/services/aws');
const group = require("../Groups/schema");
const chat = require('../Chat/schema');

exports.chatListController = async function (req, res, next) {
  try {
    const uniqueId = req.query.uniqueId;
    const userId = req.query.userId;
    const page = Math.max(0, req.query.page);
    let chatPerPage = 20;
    if (req.query.perPage) chatPerPage = parseInt(req.query.perPage);
    const whereArr = { groupName: uniqueId };
    whereArr['sendTo'] = { $in: [userId] };
    whereArr['isDeleted'] = false;
    const totalCount = await chat.countDocuments(whereArr);
    const resposne = await chatList(whereArr, chatPerPage, page)
    const responseObj = {};
    responseObj['data'] = resposne;
    responseObj['totalpage'] = Math.ceil(totalCount / chatPerPage);
    responseObj['totalRecords'] = Math.ceil(totalCount);
    responseObj['perpage'] = chatPerPage;
    return res.json(success(200, serverResponseMessage.GROUP_CHAT_MESSAGE, responseObj));

  } catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
};


exports.chatGroupListController = async (req, res, next) => {
  try {
    const whereArr = { groupMembers: { $in: [req.body.userId] }, isDeleted: false },
      totalCount = await group.countDocuments(whereArr);
    const groupResponse = await updateUserData(req.body.userId, req.body.page, req.body.perPage),
      groupNameArray = [];
    groupResponse.forEach((val) => {
      groupNameArray.push(val.groupName)
    })

    const whereArrChat = { isDeleted: false, groupName: { $in: groupNameArray }, readUserIds: { $nin: [req.body.userId] }, senderId: { $nin: [req.body.userId] } },
      chatResult = await unreadChatCount(whereArrChat);
    const tempGroupResponse = groupResponse;
    const tempchatResponse = chatResult;

    tempGroupResponse.forEach((val) => {
      const indexData = tempchatResponse.findIndex((data) => {
        return data._id == val.groupName;
      });
      if (indexData != -1) {
        val.unreadCount = tempchatResponse[indexData].count
      } else {
        val.unreadCount = 0
      }
    })

    const responseObj = {};
    responseObj['data'] = tempGroupResponse;
    responseObj['totalpage'] = Math.ceil(totalCount / req.body.perPage);
    responseObj['totalRecords'] = Math.ceil(tempGroupResponse.length);
    responseObj['perpage'] = req.body.perPage;
    return res.json(success(200, serverResponseMessage.Group_list, responseObj));
  }
  catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
}


exports.downloadFile = async function (req, res) {
  try {
    let where = {};
    if (req.body.id) {
      where = { _id: req.body.id };
    }
    if (Object.keys(where).length > 0) {
      chat.findOne(where, async (err, fileKey) => {
        if (fileKey && fileKey.fileName) {
          aws.fileDownloding(fileKey.fileName).then((fileUrl) => {
            if (fileUrl) return res.json(success(200, serverResponseMessage.File_Download_Success, { fileUrl: fileUrl }));
          })
        } else return res.json(failure(204, serverResponseMessage.File_Download_PassedData));
      });
    } else return res.json(failure(204, serverResponseMessage.File_Download_PassingData));
  } catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
};


exports.clearChatController = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const isGroup = await groupFind({ _id: _id });
    if (isGroup) {
      const findImagesChat = await findAllImagesInChat(isGroup.groupName);
      if (findImagesChat.length) {
        await aws.deleteMultipleImages(findImagesChat[0].imagesKeys)
      }
      const clearChatMsg = await clearChatMessages(isGroup.groupName);
      await groupChatMessageUpdateFind(isGroup._id);
      return res.json(success(200, serverResponseMessage.CHAT_CLEAR, clearChatMsg));
    } else
      return res.json(failure(204, serverResponseMessage.GROUP_NOT_PRESENT, {}));
  }
  catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
}

exports.allImageController = async (req, res, next) => {
  try {
    const { _id, userId } = req.body;
    const isGroup = await groupFind({ _id: _id });
    if (isGroup) {
      const imageResponse = await allImagesInChat({
        groupName: isGroup.groupName,
        senderId: userId,
        message: 'File Attached'
      })
      let obj={}
      obj['data'] = imageResponse
      return res.json(success(200, serverResponseMessage.ALL_IMAGES_FETCEHED, obj));
    } else
      return res.json(failure(204, serverResponseMessage.GROUP_NOT_PRESENT, {}));
  }
  catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
}

exports.downloadMultipleImageController = async (req, res, next) => {
  try {
    const { imagesKeys } = req.body;
    const imagesDetails = await findAllImages(imagesKeys);
    if (imagesDetails && (imagesKeys.length == imagesDetails.length)) {
      const deleteImagesResponse = await aws.deleteMultipleImages(imagesKeys)
      if (!deleteImagesResponse.Errors.length) {
        deleteMultipleImagesChat(imagesKeys)
      }
      return res.json(success(200, serverResponseMessage.SELECTED_IMAGES_DELETED, deleteImagesResponse));
    } else
      return res.json(failure(204, serverResponseMessage.IMAGES_DELETED_FAILED));
  }
  catch (error) {
    return res.json(failure(204, serverResponseMessage.Catch_Error, error.message));
  }
}