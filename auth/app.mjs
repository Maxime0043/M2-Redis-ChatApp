import mongoose from 'mongoose'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors';

/**
 * DATABASE MONGO
 *
 */
const MONGO_HOST = process.env.MONGO_HOST
if (!MONGO_HOST) throw new Error(
    "Please define MONGO_HOST"
)

await mongoose.connect(`mongodb://${MONGO_HOST}:27017/users`);

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
