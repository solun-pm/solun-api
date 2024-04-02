import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import rateLimit from 'express-rate-limit';
var bodyParser = require('body-parser')
import morgan from 'morgan';
import chalk from 'chalk';
import cors from 'cors';
import { checkToken } from './auth/check_customer_token';
import jwt from 'jsonwebtoken';

// Load environment variables:
// dotenv.config({ path: path.join(__dirname, '.env.local') }); // Irelevant for now, but will be used in development.

// Import bird handler api log function:
import { birdApiLog, birdLog , dbConnect} from 'solun-database-package';
async function connectDb() {
  await dbConnect();
}

connectDb();

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
import { handleRecoveryUserRequest } from './functions/user/recovery';
import { handleApiAccessUserRequest } from './functions/user/api_access';
import { handleApiDetailsUserRequest } from './functions/user/get_api_details';

import { handleCheckRecoveryCodeRequest } from './functions/user/forgot/check_recovery_code';
import { handleResetPasswordRequest } from './functions/user/forgot/reset_password';

import { handleCreateAliasRequest } from './functions/user/alias/add_alias';
import { handleGetAliasRequest } from './functions/user/alias/get_alias';
import { handleDeleteAliasRequest } from './functions/user/alias/delete_alias';
import { handleGetDomainsAliasRequest } from './functions/user/alias/get_domains';
import { handleSwitchStateAliasRequest } from './functions/user/alias/alias_active_switch';
import { handleGetGotosAliasRequest } from './functions/user/alias/get_gotos';

import { handleCheckDomainRequest } from './functions/user/domain/check_domain';
import { handleAddDomainRequest } from './functions/user/domain/add_domain';
import { handleGetDomainDomainRequest } from './functions/user/domain/get_domain';
import { handleGetDNSRecordsRequest } from './functions/user/domain/get_dns_records';
import { handleGetDomainDetailsRequest } from './functions/user/domain/get_domain_details';
import { handleDeleteDomainRequest } from './functions/user/domain/delete_domain';
import { handleEnableCatchAllRequest } from './functions/user/domain/enable_catch_all';
import { handleDisableCatchAllRequest } from './functions/user/domain/disable_catch_all';

import { handleAddMailboxRequest } from './functions/user/mailbox/add_mailbox';
import { handleGetMailboxRequest } from './functions/user/mailbox/get_mailbox';
import { handleGetMailboxDetailsRequest } from './functions/user/mailbox/get_mailbox_details';
import { handleChangePWDMailboxRequest } from './functions/user/mailbox/change_pwd';
import { handleChangeQuotaMailboxRequest } from './functions/user/mailbox/change_quota';
import { handleDeleteMailboxRequest } from './functions/user/mailbox/delete_mailbox';

import { handleSaveTempTokenDatabaseRequest } from './functions/database/save_temp_token';

import { handleVerifyTwoFactorRequest } from './functions/two_factor/verify';
import { handleEnableTwoFactorRequest } from './functions/two_factor/enable';
import { handleDisableTwoFactorRequest } from './functions/two_factor/disable';

import { handleJWTDetailsWebmailRequest } from './functions/webmail/jwt_details';
import { handleLoginWebmailRequest } from './functions/webmail/login';
import { handlePreAuthWebmailRequest } from './functions/webmail/pre_auth';
import { handleUserDetailsWebmailRequest } from './functions/webmail/user_details';

import { handleApiLogStatsRequest } from './functions/stats/api_log';

//: Express and Body Parser setup
const app = express();
app.use(express.json({ limit: '2500mb' }));
const jsonParser = bodyParser.json()

app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1000, // Max 1000 requests per IP
  message: 'Too many requests, please try again in 10 seconds',
  keyGenerator: (req) => {
    const clientIP = req.ip;
    return `${clientIP}`;
  }
});

const userLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10, // Max 5000 requests per IP
  message: 'Too many requests, please try again in 30 seconds',
  keyGenerator: (req) => {
    const clientIP = req.ip;
    return `${clientIP}`;
  }
});

// CORS setup:
app.use(cors());

export const morganMiddleware = morgan(function (tokens, req, res) {
  birdApiLog(tokens.method(req, res) as string || 'none',
             parseInt(tokens.status(req, res) as string) as number || 0,
             tokens.url(req, res) as string || 'none',
             parseInt(tokens['response-time'](req, res) as string) as number || 0,
             'none' as string,
             tokens.referrer(req, res) as string || 'none',
             tokens['user-agent'](req, res) as string || 'none'
            );
  return [
      chalk.hex('#ff4757').bold('🕊️  SOLUN-API --> '),
      chalk.hex('#34ace0').bold(tokens.method(req, res)),
      chalk.hex('#ffb142').bold(tokens.status(req, res)),
      chalk.hex('#ff5252').bold(tokens.url(req, res)),
      chalk.hex('#2ed573').bold(tokens['response-time'](req, res) + ' ms'),
      chalk.hex('#f78fb3').bold('@ ' + tokens.date(req, res)),
      chalk.hex('#fffa65').bold('from ' + tokens.referrer(req, res)),
      chalk.hex('#1e90ff')(tokens['user-agent'](req, res)),
  ].join(' ');
});

app.use(morganMiddleware);

async function auth(req: any, res:any, next: any) {
  const token = req.body.token;
  if(token) {
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
      if(err) {
        res.status(403).json({ error: 'Request got rejected, this ressource is protected.' });
      } else {
        next();
      }
    });
  } else {
    res.status(403).json({ error: 'Request got rejected, this ressource is protected.' });
  }
}

/* Auth handler for solun generated api keys */
async function customer_auth(req: any, res: any, next: any) {
  const apiKey = req.headers['authorization'];
  if(await checkToken(apiKey)) {
    next();
  } else {
    res.status(403).json({ error: 'Request got rejected, this ressource is protected.' });
  }
}

const timeout = (req: any, res: any, next: any) => {
  const twentyFourHours = 24 * 60 * 60 * 1000;

  req.socket.setTimeout(twentyFourHours, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timed out, please try again." });
    }
  });

  res.socket.setTimeout(twentyFourHours, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timed out, please try again." });
    }
  });

  next();
};
 

app.get('/', (req, res) => {
  res.status(200).json({ message: "This is the Solun API server, please refer to the documentation for more information." });
});

app.post('/message/create', limiter, jsonParser, handleCreateMessageRequest);
app.post('/message/check', limiter, jsonParser, handleCheckMessageRequest);
app.post('/message/delete', limiter, jsonParser, handleDeleteMessageRequest);
app.post('/message/receive', limiter, jsonParser, handleReceiveMessageRequest);

app.post('/file/check', limiter, jsonParser, handleCheckFileRequest);
app.post('/file/receive', limiter, jsonParser, handleReceiveFileRequest);
app.post('/file/upload', timeout, upload.single('file'), handleUploadFileRequest);
app.post('/file/download', timeout, limiter, jsonParser, handleDownloadFileRequest);
app.post('/file/delete', limiter, jsonParser, handleDeleteFileRequest);

app.post('/user/beta_features', limiter, auth, jsonParser, handleBetaFeaturesUserRequest);
app.post('/user/change_pwd', userLimiter, auth, jsonParser, handleChangePWDUserRequest);
app.post('/user/check', limiter, jsonParser, handleCheckUserRequest);
app.post('/user/create', userLimiter, jsonParser, handleCreateUserRequest);
app.post('/user/fast_login', limiter, auth, jsonParser, handleFastLoginUserRequest);
app.post('/user/jwt_details', limiter, auth, jsonParser, handleJWTDetailsUserRequest);
app.post('/user/login', limiter, jsonParser, handleLoginUserRequest);
app.post('/user/user_details', limiter, auth, jsonParser, handleUserDetailsUserRequest);
app.post('/user/validate_pwd', limiter, auth, jsonParser, handleValidatePWDUserRequest);
app.post('/user/recovery', limiter, jsonParser, handleRecoveryUserRequest);
app.post('/user/api_access', userLimiter, auth, jsonParser, handleApiAccessUserRequest);
app.post('/user/get_api_details', limiter, auth, jsonParser, handleApiDetailsUserRequest);

app.post('/user/check_recovery_code', limiter, jsonParser, handleCheckRecoveryCodeRequest);
app.post('/user/reset_password', limiter, jsonParser, handleResetPasswordRequest);

app.post('/user/alias/add_alias', userLimiter, auth, jsonParser, handleCreateAliasRequest);
app.post('/user/alias/get_alias', limiter, auth, jsonParser, handleGetAliasRequest);
app.post('/user/alias/delete_alias', userLimiter, auth, jsonParser, handleDeleteAliasRequest);
app.post('/user/alias/get_domains_alias', limiter, auth, jsonParser, handleGetDomainsAliasRequest);
app.post('/user/alias/switch_alias_state', userLimiter, auth, jsonParser, handleSwitchStateAliasRequest);
app.post('/user/alias/get_gotos_alias', limiter, auth, jsonParser, handleGetGotosAliasRequest);

app.post('/user/domain/check_domain', limiter, auth, jsonParser, handleCheckDomainRequest);
app.post('/user/domain/add_domain', userLimiter, auth, jsonParser, handleAddDomainRequest);
app.post('/user/domain/get_domain', limiter, auth, jsonParser, handleGetDomainDomainRequest);
app.post('/user/domain/get_dns_records', limiter, jsonParser, handleGetDNSRecordsRequest);
app.post('/user/domain/get_domain_details', limiter, auth, jsonParser, handleGetDomainDetailsRequest);
app.post('/user/domain/delete_domain', userLimiter, auth, jsonParser, handleDeleteDomainRequest);
app.post('/user/domain/enable_catch_all', userLimiter, auth, jsonParser, handleEnableCatchAllRequest);
app.post('/user/domain/disable_catch_all', userLimiter, auth, jsonParser, handleDisableCatchAllRequest);

app.post('/user/mailbox/add_mailbox', userLimiter, auth, jsonParser, handleAddMailboxRequest);
app.post('/user/mailbox/get_mailbox', limiter, auth, jsonParser, handleGetMailboxRequest);
app.post('/user/mailbox/get_mailbox_details', limiter, auth, jsonParser, handleGetMailboxDetailsRequest);
app.post('/user/mailbox/change_pwd', userLimiter, auth, jsonParser, handleChangePWDMailboxRequest);
app.post('/user/mailbox/change_quota', userLimiter, auth, jsonParser, handleChangeQuotaMailboxRequest);
app.post('/user/mailbox/delete_mailbox', userLimiter, auth, jsonParser, handleDeleteMailboxRequest);

app.post('/database/save_temp_token', limiter, auth, jsonParser, handleSaveTempTokenDatabaseRequest);

app.post('/two_factor/verify', limiter, jsonParser, handleVerifyTwoFactorRequest);
app.post('/two_factor/enable', limiter, auth, jsonParser, handleEnableTwoFactorRequest);
app.post('/two_factor/disable', limiter, auth, jsonParser, handleDisableTwoFactorRequest);

app.post('/webmail/jwt_details', limiter, auth, jsonParser, handleJWTDetailsWebmailRequest);
app.post('/webmail/login', limiter, auth, jsonParser, handleLoginWebmailRequest);
app.post('/webmail/pre_auth', limiter, auth, jsonParser, handlePreAuthWebmailRequest);
app.post('/webmail/user_details', limiter, auth, jsonParser, handleUserDetailsWebmailRequest);

app.get('/stats/api_log', limiter, auth, jsonParser, handleApiLogStatsRequest);

const server = app.listen(3000, () => {
  console.log('Solun-API server started at port 3000');
});

server.setTimeout(24 * 60 * 60 * 1000); // 24 hours
