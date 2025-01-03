const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());
app.use(cookieParser());


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



        const jobsCollection = client.db('jobPortal').collection('jobs');
        const jobsApplicationCollection = client.db('jobPortal').collection('job_application');


        //Auth related APIs

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false, //http://localhost:5173/
                })
                .send({ success: true })
        })
        // app.post('/jwt', async (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, 'secret', { expiresIn: '1h' });
        //     res.send(token)
        // })

        // jobs related api
        // সব ডাটা লোড করার জন্য -১
        app.get('/jobs', async (req, res) => {
            // user login করলে ডাটা দেখাবে
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { hr_email: email }
            }


            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // shown details 

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query);
            res.send(result);
        });

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob)
            res.send(result);
        })



        // job application apis

        //application  এর ডাটা পাওয়ার জন্য
        app.get('/job-application', async (req, res) => {
            const email = req.query.email;
            const query = { applicant_email: email }
            const result = await jobsApplicationCollection.find(query).toArray();

            // fokira way aggregate data
            for (const application of result) {
                console.log(application.job_id)
                const query1 = { _id: new ObjectId(application.job_id) }
                const job = await jobsCollection.findOne(query1);
                if (job) {
                    application.title = job.title;
                    application.location = job.location;
                    application.company = job.company;
                    application.company_logo = job.company_logo;

                }
            }
            res.send(result);
        })

        // কোন কোন ইউজার apply করছে
        app.get('/job-application/jobs/:job_id', async (req, res) => {
            const jobId = req.params.job_id;
            const query = { job_id: jobId }
            const result = await jobsApplicationCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/job-application', async (req, res) => {
            const application = req.body;
            const result = await jobsApplicationCollection.insertOne(application)

            // not best way, best way (use Aggregate)
            //skip
            const id = application.job_id;
            const query = { _id: new ObjectId(id) }
            const job = await jobsCollection.findOne(query);
            console.log(job);

            let newCount = 0;
            if (job.applicationCount) {
                newCount = job.applicationCount + 1;
            }
            else {
                newCount = 1;
            }

            // now update the job info

            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    applicationCount: newCount
                }
            }

            const updateResult = await jobsCollection.updateOne(filter, updateDoc)

            res.send(result);

        });

        app.patch('/job-application/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: data.status
                }
            }
            const result = await jobsApplicationCollection.updateOne(filter, updatedDoc);
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