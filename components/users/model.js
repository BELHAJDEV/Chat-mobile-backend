const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  contacts: {
    type: Array,
  },
});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      contacts: this.contacts,
      // exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );
  return token;
};
const User = mongoose.model("User", userSchema);

const validateUser = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    image: Joi.string(),

    email: Joi.string().min(5).max(255).required().email(),

    password: Joi.string().min(5).max(1024).required(),
  });

  return schema.validate(user);
};
const isEmailAndPassword = (req) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),

    password: Joi.string().min(5).max(1024).required(),
  });

  return schema.validate(req);
};
exports.User = User;
exports.validateUser = validateUser;
exports.isEmailAndPassword = isEmailAndPassword;
