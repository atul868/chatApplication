const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT,
  databaseURL: process.env.MONGODB_URI,
  development_databaseURL: process.env.DEVELOPMENT_URI,
  secret: process.env.JWT_SECRET,
  environment: process.env.ENVIRONMENT,
  perPageRecord: 10,
  perPage: 10,
  aws: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    filePath: process.env.AWS_FILE_PATH
  },
  s3: {
    bucket: process.env.S3_BUCKET,
    folder: process.env.S3_FOLDER,
  },
};