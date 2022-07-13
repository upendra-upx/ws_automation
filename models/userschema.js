const mongoose = require(`mongoose`);

const userSchema = new mongoose.Schema({
  mobile:{
    type: Number,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  active:{
    type: Boolean,
    required: true,
    default: false
  }
})

module.exports = mongoose.model(`users`, userSchema);