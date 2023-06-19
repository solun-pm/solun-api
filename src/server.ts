import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
var bodyParser = require('body-parser')
import morgan from 'morgan';
import chalk from 'chalk';

// Multer setup for file uploads:
import multer from 'multer';
import crypto from "crypto";
import { extname } from "path";

const storage = multer.diskStorage({
    destination: '/home/daniel/tmp/',
    filename: function (req, file, cb) {
        const uniqueSuffix = `${crypto.randomBytes(64).toString('hex')}`;
        const extension = extname(file.originalname).slice(1);
        const systemFilename = `${uniqueSuffix}.${extension}`;
        cb(null, systemFilename)
    }
})

const upload = multer({ storage: storage });


// Load environment variables:
dotenv.config({ path: path.join(__dirname, '.env.local') });

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

app.listen(3000, () => {
  console.log('Solun-API server started at port 3000');
});