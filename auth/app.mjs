import mongoose from 'mongoose'
import express from 'express'
import helmet from 'helmet'
import redis from 'redis'
import cookieParser from 'cookie-parser'
import cors from 'cors';

const SESSION_MAX_AGE = process.env.SESSION_MAX_AGE
if (!SESSION_MAX_AGE) throw new Error(
    "Please define SESSION_MAX_AGE"
)

/**
 * DATABASE MONGO
 *
 */
const MONGO_HOST = process.env.MONGO_HOST
if (!MONGO_HOST) throw new Error(
    "Please define MONGO_HOST"
)

await mongoose.connect(`mongodb://${MONGO_HOST}:27017/users`);

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

/**
 * DATABASE REDIS
 * 
 */
const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT

const client = redis.createClient(
  {
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  }
);

/**
 * API
 *
 */
const app = express()

// security
app.use(helmet())
app.disable('x-powered-by')

// cors
const corsOptions = {
  origin: "*",
  credentials: true,
}
app.use(cors(corsOptions))

app.use(cookieParser())

app.use(express.json())

const EXPRESS_PORT = process.env.EXPRESS_PORT
if (!EXPRESS_PORT) throw new Error(
    "Please define EXPRESS_PORT"
)

console.log("Listening on port:", EXPRESS_PORT)
app.listen(EXPRESS_PORT)

/**
 * Graceful-ish shutdown
 *
 */
const signals = {
  'SIGINT': 2,
  'SIGTERM': 15
};

function shutdown(signal, value) {
  server.close(function () {
    console.log('server stopped by ' + signal);
    process.exit(128 + value);
  });
}

Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});
