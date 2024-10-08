const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
    cors({
        origin: ["http://localhost:5173", 
            "https://inventoria-8dd39.web.app", 
            "https://inventoria-8dd39.firebaseapp.com",
        ],
        credentials: true,
    })
);
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hsfxbe1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const productCollection = client.db('inventoria').collection('products');

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 1;  
            const limit = parseInt(req.query.limit) || 10;  
            const skip = (page - 1) * limit;  

            const sortOption = req.query.sortOption || '';
            const brandFilter = req.query.brand || '';
            const categoryFilter = req.query.category || '';
            const priceRange = req.query.priceRange || '';
            const searchQuery = req.query.searchQuery || '';

            // Build query object for filtering
            const query = {};

            if (brandFilter) {
                query.brand = brandFilter;
            }

            if (categoryFilter) {
                query.category = categoryFilter;
            }

            if (searchQuery) {
                query.productName = { $regex: searchQuery, $options: 'i' }; 
            }

            if (priceRange === 'low') {
                query.price = { $lt: 50 };
            } else if (priceRange === 'mid') {
                query.price = { $gte: 50, $lte: 100 };
            } else if (priceRange === 'high') {
                query.price = { $gt: 100 };
            }

            // Sorting 
            const sort = {};
            if (sortOption === 'priceLowToHigh') {
                sort.price = 1;
            } else if (sortOption === 'priceHighToLow') {
                sort.price = -1;
            } else if (sortOption === 'newestFirst') {
                sort.createdAt = -1;
            }

            // Fetch products with filtering, sorting, and pagination
            const cursor = productCollection.find(query).sort(sort).skip(skip).limit(limit);
            const result = await cursor.toArray();

            const totalItems = await productCollection.countDocuments(query);  
            const totalPages = Math.ceil(totalItems / limit);  

            res.send({
                products: result,
                totalItems,
                totalPages,
                currentPage: page,
            });
        });


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('product is running')
})

app.listen(port, () => {
    console.log(`Product Server is running on port ${port}`);
})