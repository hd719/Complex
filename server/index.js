const keys = require("./keys");

// Express App set up
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors()); // allow us to make a request from one domain (react app) to a completly different domain (port) our server is running on
app.use(bodyParser.json()); // Convert the body of the post request into a json object

// Set up and connect to PG server
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});

// Error handling
pgClient.on("error", () => console.log("Lost PG connection"));

// Table that is going to store all of the values using ids
// Going to create a table called values
// Number is going to be the column that is created and is going to be the value that was submitted
pgClient
  .query("CREATE TABLE IF NOT EXISTS values (number INT)")
  .catch(err => console.log(err));

// Set up Redis
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get("/", (req, res) => {
  res.send("hi");
});

// This url will query our running PG instance and retrieve all values in the DB
app.get("/values/all", async (req, res) => {
  // Look at the values tables and get all the queries
  const values = await pgClient.query("SELECT * from values");

  // Sending the information back and the .rows ensures we get only the values
  res.send(values.rows);
});

// This url will query all of the different values and indicies that have ever been submitted to our back end
app.get("/values/current", async (req, res) => {
  // Look at the hash "values" and return all info
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

// Recieve new values from our react app
app.post("/values", async (req, res) => {
  const index = req.body.value;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index is too high");
  }

  // Nothing yet! indicates we have not yet calculated a value for the given index
  redisClient.hset("values", index, "Nothing yet!");

  // Start calculating the value given the index
  redisPublisher.publish("insert", index);

  // Look at pg client and add in the new index that was submitted
  pgClient.query("INSERT INTO values(number VALUES($1)", [index]);

  // Doing some work to calculate value
  res.send({ working: true });
});

// Port
app.listen(5000, error => {
  console.log("Listening to port 5000");
});
