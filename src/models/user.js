const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  country_code: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
module.exports = User;
