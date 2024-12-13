const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.usfrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // jobs related  apis

        const jobsCollection = client.db('jobPortal').collection('jobs');
        const jobsApplicationCollection = client.db('jobPortal').collection('job-application');

        // সব ডাটা লোড করার জন্য -১
        app.get('/jobs', async (req, res) => {
            const cursor = jobsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // shown details 

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        // job application apis

        app.get('/job-application', async (req, res) => {
            const email = req.query.email;
            const query = { applicant_email: email }
            const result = await jobsApplicationCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/job-application', async (req, res) => {
            const application = req.body;
            const result = await jobsApplicationCollection.insertOne(application)
            res.send(result);

        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.log);


app.get('/', (req, res) => {
    res.send("Job is Falling from sky")
})

app.listen(port, () => {
    console.log(`Job is Watting at: ${port}`)
})