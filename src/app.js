// importing/ requiring packages
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/user')

// creating express server
const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));
// setting cors options
const corsOptions = {
  origin: "http://localhost:8081"
};
app.use(cors(corsOptions));
// set port to listen for requests
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

// post route to create an user
app.post('/user', (req, res) => {
  new User(req.query).save()
    .then(() => {
      res.status(200).json({status: 200, message: 'user was created'})
    })
    .catch(err => console.log(err));
});

// simple route
app.get("/users", (req, res) => {
  User.find()
    .then(result => res.send(result))
    .catch(err => console.log(err));
});
