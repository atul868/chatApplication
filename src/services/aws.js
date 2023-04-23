const AWS = require('aws-sdk');
const fs = require('fs');
const indexing = require('../../config/index');
const ID = indexing.aws.key;
const SECRET = indexing.aws.secret;
const BUCKET_NAME = indexing.s3.bucket;
const REGION = indexing.aws.region;
const FILE_PATH = indexing.aws.filePath

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
  region: REGION,
});

/* UPLOADING FILE INTO S3 BUCKET */
exports.fileUpload = async function (fileName, groupName) {
  try {
    if (fileName != null) {
      return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(process.env.PWD + '/resources/attachments/' + fileName);
        const params = {
          Bucket: BUCKET_NAME,
          Key: `${FILE_PATH}${fileName}`,
          Body: fileContent,
          ACL: 'public-read',
        };
        s3.upload(params, function (err, data) {
          if (err) {
            throw err;
          }
          const path = process.env.PWD + '/resources/attachments/' + fileName;
          fs.unlink(path, (err) => {
            if (err) return err;
          });
          resolve(data);
        });
      });
    }
  } catch (error) {
    return error;
  }
};

/* FILE DOWNLOAD FROM AWS S3 BUCKET */
exports.fileDownloding = function (fileKey) {
  try {
    if (fileKey != null) {
      return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
          accessKeyId: ID,
          secretAccessKey: SECRET,
          region: REGION,
        });
        const options = {
          Bucket: BUCKET_NAME,
          Key: `${FILE_PATH}${fileKey}`,
        };
        s3.getObject(options, function (err, data) {
          if (err) {
            throw err;
          } else {
            var json = new Buffer(data.Body).toString("base64");
            resolve(json);
          }
        });
      });
    }
  } catch (error) {
    return error;
  }
};

/* FILE DELETE FROM AWS S3 BUCKET */
exports.deleteMultipleImages = (imagesKeys) => {
  try {
    return new Promise((resolve, reject) => {
      const paramsArray = imagesKeys.map(key => ({
        Key: `${FILE_PATH}${key}`
      }));

      const params = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: paramsArray,
          Quiet: false
        }
      };

      // Delete Selected images
      s3.deleteObjects(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    return error;
  }
}