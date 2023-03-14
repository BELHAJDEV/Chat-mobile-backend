const mongoose = require("mongoose");
const Joi = require("joi");

const messageSchema = mongoose.Schema({
  value: {
    type: String,
    required: true,
  },
  sender: {
    _id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  receiver: {
    _id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Message = mongoose.model("message", messageSchema);

const validateMessage = (msg) => {
  const Schema = Joi.object({
    value: Joi.string().required(),
    sender: {
      _id: Joi.string().required(),
      username: Joi.string().required(),
    },
    receiver: {
      _id: Joi.string().required(),
      username: Joi.string().required(),
    },
    // date: Joi.date(),
  });
  return Schema.validate(msg);
};

exports.Message = Message;
exports.validateMessage = validateMessage;
