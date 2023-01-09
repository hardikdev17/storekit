import { Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import AWS from "aws-sdk";
import multerS3 from "multer-s3";
import Debug from "debug";

const debug = Debug("meroku:server");
const s3 = new AWS.S3({
  signatureVersion: "v4",
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: "ap-south-1",
});

class awsS3Controller {
  constructor() {
    this.uploadFile = this.uploadFile.bind(this);
    this.getPreSignedUrl = this.getPreSignedUrl.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  /**
   * multerS3 functionality to upload the multipart/formdata format file to aws-s3
   * To know more refer to: https://www.npmjs.com/package/multer-s3
   */
  upload = multer({
    storage: multerS3({
      s3,
      acl: "private",
      bucket: process.env.BUCKET_NAME,
      contentDisposition: "attachment",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (
        req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
      ) {
        cb(null, Object.assign({}, req.body));
      },
      key: function (
        req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
      ) {
        cb(null, req.body.dappId);
      },
    }),
    limits: { fileSize: 1024 * 1024 * 1024 * 10 }, // file upload size limit - 10GB
    fileFilter: function (req: Request, file: Express.Multer.File, cb: any) {
      const filetypes = /apk|zip/; // only .apk & .zip files are allowed
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype) {
        return cb(null, true);
      } else {
        cb("Error: Allowed file extensions - apk | zip !");
      }
    },
  });

  /**
   * File upload to aws-s3
   */
  uploadFile = async (req: Request, res: Response) => {
    console.log(req.file);
    return res.status(200).json({ success: true, file: req.file });
  };

  /**
   * Get file presigned url from aws-s3 servers
   * @param params eg: { Bucket: "bucketName", Key: "objectKey",}
   */
  getPreSignedUrl = async (req: Request, res: Response) => {
    try {
      const url = s3.getSignedUrl("getObject", {
        Bucket: process.env.BUCKET_NAME,
        Key: <string>req.query.dappId,
        Expires: 60 * 15, // 15 minutes
      });
      return res.status(200).json({ success: true, url: url });
    } catch (e) {
      return res.status(400).json({ errors: [{ msg: e.message }] });
    }
  };

  /**
   * Delete file from aws s3 servers
   * @param params eg: { Bucket: "bucketName", Key: "objectKey",}
   */
  deleteFile = async (req: Request, res: Response) => {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.BUCKET_NAME,
      Key: <string>req.body.dappId,
    };
    try {
      const response = await s3.deleteObject(params).promise();
      return res.json(response);
    } catch (e) {
      return res.status(400).json({ errors: [{ msg: e.message }] });
    }
  };

  /**
   * To get the metadata of a dappId without loading the file
   * @param s3Data eg: { Bucket: "bucketName", Key: "objectKey", ACL: "public-read",
                    Body: JSON.stringify(dataObject), ContentType: "application/json", 
                    Metadata: { email: "sample@gmail.com", dappId: "300",}, 
                } 
   */
  getMetaData = async (s3Data: AWS.S3.HeadObjectRequest) => {
    try {
      await s3.headObject(s3Data).promise();
    } catch (e) {
      debug(e.message);
    }
  };
}

export default new awsS3Controller();
