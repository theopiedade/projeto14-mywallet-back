import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import bcrypt from 'bcrypt';


const app = express();
app.use(cors());
app.use(express.json())
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
const nameSchema = joi.object({
    name: joi.string().required()
});

const emailSchema = joi.object({
    
});

const passwordSchema = joi.object({
    password: joi.string().required().min(3)
});

const schema = Joi.object({
    name: Joi.string().required(),

    email: Joi.string().required()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),

    password: Joi.string().required().min(3)
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
        password: bcrypt.hashSync(senha, 10)
    }

    console.log(msg);

   try {
       await db.collection('users').insertOne(user);

       res.sendStatus(201);
       res.send('Created');
       res.send(user);
    } catch (err) {
       console.log(err);
       res.sendStatus(500);
   }
 
});

app.listen(5000);