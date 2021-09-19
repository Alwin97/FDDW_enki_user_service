const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  functionName: {
    type: String,
    required: true
  },
  log: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Log = mongoose.model('Log', logSchema);
module.exports = Log;
