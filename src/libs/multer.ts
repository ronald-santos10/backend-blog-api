import multer, { FileFilterCallback } from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME as string,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    // Define o nome do arquivo no S3
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    cb(null, `covers/${uniqueFileName}`);
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado."));
    }
  },
});
