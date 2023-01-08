import mongoose from 'mongoose'
import express from 'express'
import helmet from 'helmet'
import Joi from 'joi'
import bcrypt from 'bcrypt'
import redis from 'redis'
import { v4 as uuidv4 } from 'uuid';
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
  origin: ['http://localhost:4173', 'http://localhost:5173'],
  credentials: true,
}
app.use(cors(corsOptions))

app.use(cookieParser())

app.use(express.json())

app.post('/register', async (req, res) => {
    const payload = req.body

    // payload validation
    const scheme = Joi.object({
        email: Joi.string().min(5).max(255).email().required(),
        username: Joi.string().min(5).max(255).required(),
        password: Joi.string().min(5).max(255).required()
    });
    const {value, error} = scheme.validate(payload);
    if (error) return res.status(400).json({
        error: error.details[0].message
    })

    // don't create account if it already exists
    const user = await User.findOne({email: value.email})
    if (user) return res.status(400).json({
        error: "This account already exists"
    })

    // create user in DB
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(value.password, salt);
    value.password = passwordHash;
    const userCreated = new User(value);
    await userCreated.save();

    // done ✅
    res.status(201).send({email: value.email, username: value.username});
})

app.post("/login", async (req, res) => {
    const payload = req.body

    // payload validation
    const scheme = Joi.object({
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(5).max(255).required()
    });
    const {value, error} = scheme.validate(payload);
    if (error) return res.status(400).json({
        error: error.details[0].message
    })

    // get user from db
    const user = await User.findOne({email: value.email})
    if (!user) return res.status(400).json({
        error: "Bad credentials"
    })

    // check the password hash
    const passwordIsValid = await bcrypt.compare(payload.password, user.password);
    if (!passwordIsValid) return res.status(400).json({
        error: "Bad credentials"
    })

    // authenticate by sending back a cookie containing a session id associated with a redis hash
    await client.connect()
    const sid = uuidv4()

    // Create a redis session that expire after one hour
    await client.hSet('user-session:' + sid, 'userId', user._id.toString()) 
    
    // Clean deconnexion of redis
    await client.quit()

    res.status(200).cookie("session_id", sid, { maxAge: SESSION_MAX_AGE * 1000 }).json({ username: user.username, userId: user._id.toString() })
})

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
