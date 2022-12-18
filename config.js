var mongodb = require('mongodb');
var dotenv = require('dotenv').config();
var mongoClient = mongodb.MongoClient;
let db;
let connection;

async function connectDb(req,res,next){

    try {
        connection = await mongoClient.connect(process.env.DB);
        db = await connection.db("Reset");
        return db

    } catch (error) {
        res.json({message : "Something went wrong in connecting"})
    }
}

async function closeConnection(req,res,next){

    try {
        if(connection){
            await connection.close()
        }else{
            console.log("No Connection")
        }
    } catch (error) {
        res.json({message : "Something went wrong in Disconnecting"})
    }
}

module.exports = {connectDb,connection,db,closeConnection}