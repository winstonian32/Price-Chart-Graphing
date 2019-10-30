const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const port = 4000;

app.use(bodyParser.json());

const db = "mongodb://localhost:27017/portfolio";

mongoose.connect(db);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/trades", require("./routes/trades"));

app.listen(port, () => console.log(`Listening on port ${port}`));
