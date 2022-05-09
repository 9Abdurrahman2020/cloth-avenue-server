const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT;
app.use(cors());
app.use(express.json());
const stripe = require("stripe")(process.env.stripe_secret);

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.y7ez2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const mongodbServer = async () => {
  try {
    await client.connect();
    const database = client.db("cloth_avenue");
    const productCollection = database.collection("products");
    const reviewsCollection = database.collection("reviews");
    const usersCollection = database.collection("users");
    const ordersCollection = database.collection("orders");

    // get all Products
    app.get("/products", async (req, res) => {
      const products = await productCollection.find().toArray();
      res.json(products);
    });

    // get category product
    app.get("/products/:category", async (req, res) => {
      const product = await productCollection
        .find({
          category: req.params.category,
        })
        .toArray();
      res.json(product);
    });
    app.get("/products-for/:for", async (req, res) => {
      const product = await productCollection
        .find({
          for: req.params.for,
        })
        .toArray();
      res.json(product);
    });
    // get product by id
    app.get("/product/:id", async (req, res) => {
      const product = await productCollection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.json(product);
    });
    // post a review
    app.post("/reviews/", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.json(result);
    });
    // post a order
    app.post("/orders/", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.json(result);
    });
    // get order info by transaction id
    app.get("/order/:id", async (req, res) => {
      const result = await ordersCollection.findOne({
        transactionId: req.params.id,
      });
      res.json(result);
    });
    // get order by user email
    app.get("/orders/:email", async (req, res) => {
      const result = await ordersCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.json(result);
    });
    // get a single product reviews
    app.get("/reviews/:id", async (req, res) => {
      const reviews = await reviewsCollection
        .find({
          id: req.params.id,
        })
        .toArray();
      res.json(reviews);
    });
    //role checkup
    app.get("/role/:email", async (req, res) => {
      const result = await usersCollection.findOne({ email: req.params.email });
      if (result?.role) {
        res.json(result.role);
      } else {
        res.json(null);
      }
    });
    // post a user
    app.put("/user", async (req, res) => {
      const filter = { email: req.body.email };
      const updateDoc = {
        $set: req.body,
      };
      const options = { upsert: true };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    // make an admin
    app.put("/make-admin/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const updateDoc = {
        $set: { email: req.params.email, role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentInfo.product.price * paymentInfo.product.quantity * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    });
  } finally {
  }
};
mongodbServer().catch(console.dir);

app.get("/", (req, res) => {
  res.json("Cloth avenue server is running");
});
app.listen(port, () => {
  console.log("cloth avenue server is running on port:", port);
});
