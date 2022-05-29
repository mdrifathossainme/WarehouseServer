const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ debug: true })
const cors = require('cors');
const app=express();
const jwt = require('jsonwebtoken');
const port= process.env.PORT||5000;
app.use(express.json())
app.use(cors())

function verifyJWT(req,res,next){
    const authHeader=req.headers.authonrization;
    console.log(authHeader);
    if(!authHeader){
        return res.status(401).send({message:"Unauthorizes Access"})
    }
    const token=authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
        if(err){
            return res.status(403).sen({message:"Forbidden access"})
        }
        req.decoded=decoded;
        next()

    })




}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ik03m.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect()
        const warehouseCollection=client.db('warehouse').collection('service');
        const additemCollection=client.db('warehouse').collection('items');



        app.post('/gettoken',async(req ,res)=>{
            const user=req.body;
            const accessToken=jwt.sign(user,process.env.ACCESS_TOKEN,{
                expiresIn:"1d"
            });
            res.send({accessToken})
        })

        app.get('/',(req,res)=>{
            res.send('Hellow assignment')
        })
        app.get('/service',async(req,res)=>{
            const query={}
            const cursor= warehouseCollection.find(query)
            const result =await cursor.toArray();
             res.send(result)
        })
        app.get('/service/:id',async(req,res)=>{
            const id=req.params.id;
            const item={_id:ObjectId(id)}
            const result =await warehouseCollection.findOne(item)
            res.send(result)
        })


        app.put('/service/:id', async(req,res)=>{
            const id=req.params.id;
            const  updateQuantity= await req.body;
            const filter= {_id:ObjectId(id)}
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity:updateQuantity.quantity
                },
              };
            const result = await warehouseCollection.updateOne(filter,updateDoc,options)
            res.send(result)
        
    
           })
           
           app.post('/additem', async(req,res)=>{
            const additem= req.body;
            const result= await additemCollection.insertOne(additem)
            res.send(result)
        })


        app.get('/alladditem',async(req,res)=>{
            console.log(req.query)
            const page= parseInt(req.query.page)
            const size=parseInt(req.query.size)
            const query={};
            const cursor= additemCollection.find(query);
            let products
            if(page||size){
                products= await cursor.skip(page*size).limit(size).toArray()
            }
            else{
                products= await cursor.toArray()
            }
         
            res.send(products)
        })



        app.get('/additem', verifyJWT,async(req,res)=>{
            const decodeEmail=req.decoded.email;
            const email=req.query.email;
          if(email===decodeEmail){
            const query={email}
            const cursor= additemCollection.find(query)
            const  item =await cursor.toArray()
            res.send(item)

          }
        })
        app.delete('/additem/:id', async(req,res)=>{
            const id= req.params.id;
            const qurey={_id:ObjectId(id)}
            const result= await additemCollection.deleteOne(qurey);
            res.send(result)
           })

        app.delete('/alladditem/:id', async(req,res)=>{
            const id= req.params.id;
            const qurey={_id:ObjectId(id)}
            const result= await additemCollection.deleteOne(qurey);
            res.send(result)
           })


           app.get('/itemCount',async(req,res)=>{
            const count= await additemCollection.estimatedDocumentCount()
            res.send({count})
        })







    }
    finally{
        
    }





}run().catch(console.dir)
app.listen(port)