import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
var bodyParser = require('body-parser')

// Load environment variables:
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Routes:
import { handleCreateMessageRequest } from './functions/message/create';
import { handleCheckMessageRequest } from './functions/message/check';
import { handleDeleteMessageRequest } from './functions/message/delete';
import { handleReceiveMessageRequest } from './functions/message/receive';
import { handleCheckFileRequest } from './functions/file/check';
import { handleReceiveFileRequest } from './functions/file/receive';

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

app.get('/', (req, res) => {
  res.send('Solun-API');
});

app.post('/message/create', limiter, jsonParser, handleCreateMessageRequest);
app.post('/message/check', limiter, jsonParser, handleCheckMessageRequest);
app.post('/message/delete', limiter, jsonParser, handleDeleteMessageRequest);
app.post('/message/receive', limiter, jsonParser, handleReceiveMessageRequest);
app.post('/file/check', limiter, jsonParser, handleCheckFileRequest);
app.post('/file/receive', limiter, jsonParser, handleReceiveFileRequest);

app.listen(3000, () => {
  console.log('Solun-API server started at port 3000');
});