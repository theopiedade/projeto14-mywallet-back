import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();


// DB Connection init
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
	await mongoClient.connect();
	console.log('MongoDB Connected!');
} catch (err) {
  console.log(err.message);
}

const db = mongoClient.db();
// DB Connection end

// JOI Schemas init
const schema = joi.object({
    name: joi.string().required(),

    email: joi.string().required()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),

    password: joi.string().required().min(3)
})

const signinSchema= joi.object({
    email: joi.string().required()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),

    password: joi.string().required().min(3)
})

// JOI Schemas end


app.post("/signup", async (req, res) => {
    const {name, email, password} = req.body;

    const validateSchema = schema.validate(req.body, { abortEarly: false })
    if (validateSchema.error) return res.sendStatus(422);

    const checkemail = await db.collection('users').findOne({email})
    if (checkemail) return res.sendStatus(409);
    
    const user = {
        name: name,
        email: email,
        password: bcrypt.hashSync(password, 10)
    }

   try {
       await db.collection('users').insertOne(user);
       return res.sendStatus(201);
    } 
    catch (err) {
       console.log(err);
       res.sendStatus(500);
   }
 
});

app.post("/signin", async (req, res) => {
    const {email, password} = req.body;

    const validateSchema = signinSchema.validate(req.body, { abortEarly: false })
    if (validateSchema.error) return res.sendStatus(422);

    const user = await db.collection('users').findOne({ email });
    if(user && bcrypt.compareSync(password, user.password)) {
       const token = uuid();
       
       const data = {
        userId: user._id,
        token: token,
       }
      
       try {
          await db.collection('sessions').insertOne(data);
          return res.send(token);
        } 
        catch (err) {
           console.log(err);
           res.sendStatus(500);
       }
    } 
    else return res.sendStatus(404);

});

app.get('/users', async (req, res) => {
    try {
      const users = await db.collection('users').find().toArray();
      res.send(users);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });


  app.post("/transactions", async (req,res) => {
    const { authorization } = req.header;
    const token = authorization?.replace('Bearer ', '');

    if(!token) return res.sendStatus(401);
  
      try {
       const session = await db.collection("sessions").findOne({ token });
        if (!session) return res.sendStatus(401);
  
          const user = await db.collection("users").findOne({ _id: session.userId })
  
          if(user) {
            const {type, value, description} = req.body;
            const data = {
                userID: user,
                time: dayjs(Date.now()).format('DD/MM'),
                type: type,
                value: value,
                description: description
            }
          await db.collection("transactions").insertOne({data});
          return res.sendStatus(201);
        } else {
          res.sendStatus(401);
        }
      } catch (err) { 
          res.status(500).send(err.message)
      }  
  });


  app.get('/transactions', async (req, res) => {
    try {
      const transactions = await db.collection('transactions').find().toArray();
      res.send(transactions);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

  app.get('/sessions', async (req, res) => {
    try {
      const sessions = await db.collection('sessions').find().toArray();
      res.send(sessions);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

app.listen(5000);