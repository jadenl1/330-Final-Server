require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.fmuobju.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Cloud!');
});

  
// Define a route to get all items
app.get('/GetPosts', async (req, res) => {
    try {
        await client.connect();
    
        // Specify the database and collection where you want to insert data
        const database = client.db(process.env.MONGO_DB_NAME);
        const collection = database.collection(process.env.MONGO_COLLECTION);
    
        // Retrieve all items from the 'items' collection
        // Find all documents in the collection
        const cursor = collection.find();

        // Convert the cursor to an array of documents
        const documents = (await cursor.toArray()).reverse();

        // Send the array of items in the response
        res.json(documents);
    } catch(error){
        res.status(500).json({ error: 'Internal Server Error' });
    }finally {
        await client.close();
    }
});

const cache = new NodeCache();
let cachedMovie = null;

app.get('/GetRandomMovie', async (req, res) => {
    // Check if the movie is already cached for the day
    if (cachedMovie) {
      res.json(cachedMovie);
    } else {
        const options = {
            method: 'GET',
            url: 'https://unogsng.p.rapidapi.com/search',
            params: {
              start_year: '1972',
              orderby: 'rating',
              audiosubtitle_andor: 'and',
              limit: '100',
              subtitle: 'english',
              countrylist: '78,46',
              audio: 'english',
              country_andorunique: 'unique',
              offset: '0',
              end_year: '2019'
            },
            headers: {
              'X-RapidAPI-Key': '92e3539755mshd891009343a85bfp19f985jsnc0487541d931',
              'X-RapidAPI-Host': 'unogsng.p.rapidapi.com'
            }
        };    
  
        try {
            const response = await axios.request(options);

            const movies = response.data.results;

            // console.log(movies);
    
            if (movies.length > 0) {
            const randomIndex = Math.floor(Math.random() * movies.length);
            const randomMovie = movies[randomIndex];
    
            // Cache the random movie for the day
            cachedMovie = randomMovie;
            cache.set('randomMovie', cachedMovie, 86400);

            console.log(randomMovie);

            res.json(randomMovie);
            } else {
            res.status(404).json({ error: 'No movies found in the response' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
  });

app.post("/PostReview", async (req, res) => {
    try {

        data = req.body.review;

        await client.connect();
    
        // Specify the database and collection where you want to insert data
        const database = client.db(process.env.MONGO_DB_NAME);
        const collection = database.collection(process.env.MONGO_COLLECTION);
    
        // Document to be inserted
        const documentToInsert = {
          review: data
        };
    
        // Insert one document
        await collection.insertOne(documentToInsert);
    } finally {
        await client.close();
    }
})



app.listen(4000, () => console.log(`Running on port 4000`));