// importing/ requiring packages
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const {connect} = require("mongoose");

// creating express server
const app = express();

// set port, listen for requests
const PORT = process.env.PORT || 8080;

// connection to database
const databaseUri = 'mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-users?retryWrites=true&w=majority'
mongoose.connect(databaseUri)
  .then(r => {
    app.listen(PORT, () => {
      console.log('Server is running on Port', PORT)
    })
  })
  .catch(err => console.log(err));

// setting cors options
const corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

// simple route
app.get("/", (req, res) => {
  res.json({message: "Welcome to enki application."});
});
