import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import rateLimit from 'express-rate-limit';
var bodyParser = require('body-parser')
import morgan from 'morgan';
import chalk from 'chalk';

// Load environment variables:
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Import bird handler api log function:
import { birdApiLog } from 'solun-database-package';

// Multer setup for file uploads:
import multer from 'multer';
import crypto from "crypto";
import { extname } from "path";

const storage = multer.diskStorage({
    destination: process.env.FILE_DESTINATION_PATH,
    filename: function (req, file, cb) {
        const uniqueSuffix = `${crypto.randomBytes(64).toString('hex')}`;
        const extension = extname(file.originalname).slice(1);
        const systemFilename = `${uniqueSuffix}.${extension}`;
        cb(null, systemFilename)
    }
})

const upload = multer({ storage: storage });

// Routes:
import { handleCreateMessageRequest } from './functions/message/create';
import { handleCheckMessageRequest } from './functions/message/check';
import { handleDeleteMessageRequest } from './functions/message/delete';
import { handleReceiveMessageRequest } from './functions/message/receive';

import { handleCheckFileRequest } from './functions/file/check';
import { handleReceiveFileRequest } from './functions/file/receive';
import { handleUploadFileRequest } from './functions/file/upload';
import { handleDownloadFileRequest } from './functions/file/download';
import { handleDeleteFileRequest } from './functions/file/delete';

import { handleBetaFeaturesUserRequest } from './functions/user/beta_features';
import { handleChangePWDUserRequest } from './functions/user/change_pwd';
import { handleCheckUserRequest } from './functions/user/check';
import { handleCreateUserRequest } from './functions/user/create';
import { handleFastLoginUserRequest } from './functions/user/fast_login';
import { handleJWTDetailsUserRequest } from './functions/user/jwt_details';
import { handleLoginUserRequest } from './functions/user/login';
import { handleUserDetailsUserRequest } from './functions/user/user_details';
import { handleValidatePWDUserRequest } from './functions/user/validate_pwd';

import { handleSaveTempTokenDatabaseRequest } from './functions/database/save_temp_token';

import { handleVerifyTwoFactorRequest } from './functions/two_factor/verify';
import { handleEnableTwoFactorRequest } from './functions/two_factor/enable';
import { handleDisableTwoFactorRequest } from './functions/two_factor/disable';

//: Express and Body Parser setup
const app = express();
const jsonParser = bodyParser.json()

app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5000, // Max 5000 requests per IP
  message: 'Too many requests, please try again in 10 seconds',
  keyGenerator: (req) => {
    const clientIP = req.ip;
    return `${clientIP}`;
  }
});

export const morganMiddleware = morgan(function (tokens, req, res) {
  birdApiLog(tokens.method(req, res) as string,
             parseInt(tokens.status(req, res) as string) as number,
             tokens.url(req, res) as string,
             parseInt(tokens['response-time'](req, res) as string) as number,
             tokens['remote-addr'](req, res) as string,
             tokens.referrer(req, res) as string || 'none',
             tokens['user-agent'](req, res) as string
            );
  return [
      chalk.hex('#ff4757').bold('🕊️  SOLUN-API --> '),
      chalk.hex('#34ace0').bold(tokens.method(req, res)),
      chalk.hex('#ffb142').bold(tokens.status(req, res)),
      chalk.hex('#ff5252').bold(tokens.url(req, res)),
      chalk.hex('#2ed573').bold(tokens['response-time'](req, res) + ' ms'),
      chalk.hex('#f78fb3').bold('@ ' + tokens.date(req, res)),
      chalk.yellow(tokens['remote-addr'](req, res)),
      chalk.hex('#fffa65').bold('from ' + tokens.referrer(req, res)),
      chalk.hex('#1e90ff')(tokens['user-agent'](req, res)),
  ].join(' ');
});

app.use(morganMiddleware);

app.get('/', (req, res) => {
  res.status(404).json({ message: "This is the Solun API server, please refer to the documentation for more information." });
});

app.post('/message/create', limiter, jsonParser, handleCreateMessageRequest);
app.post('/message/check', limiter, jsonParser, handleCheckMessageRequest);
app.post('/message/delete', limiter, jsonParser, handleDeleteMessageRequest);
app.post('/message/receive', limiter, jsonParser, handleReceiveMessageRequest);

app.post('/file/check', limiter, jsonParser, handleCheckFileRequest);
app.post('/file/receive', limiter, jsonParser, handleReceiveFileRequest);
app.post('/file/upload', upload.single('file'), handleUploadFileRequest);
app.post('/file/download', limiter, jsonParser, handleDownloadFileRequest);
app.post('/file/delete', limiter, jsonParser, handleDeleteFileRequest);

app.post('/user/beta_features', limiter, jsonParser, handleBetaFeaturesUserRequest);
app.post('/user/change_pwd', limiter, jsonParser, handleChangePWDUserRequest);
app.post('/user/check', limiter, jsonParser, handleCheckUserRequest);
app.post('/user/create', limiter, jsonParser, handleCreateUserRequest);
app.post('/user/fast_login', limiter, jsonParser, handleFastLoginUserRequest);
app.post('/user/jwt_details', limiter, jsonParser, handleJWTDetailsUserRequest);
app.post('/user/login', limiter, jsonParser, handleLoginUserRequest);
app.post('/user/user_details', limiter, jsonParser, handleUserDetailsUserRequest);
app.post('/user/validate_pwd', limiter, jsonParser, handleValidatePWDUserRequest);

app.post('/database/save_temp_token', limiter, jsonParser, handleSaveTempTokenDatabaseRequest);

app.post('/two_factor/verify', limiter, jsonParser, handleVerifyTwoFactorRequest);
app.post('/two_factor/enable', limiter, jsonParser, handleEnableTwoFactorRequest);
app.post('/two_factor/disable', limiter, jsonParser, handleDisableTwoFactorRequest);

app.listen(3000, () => {
  console.log('Solun-API server started at port 3000');
});