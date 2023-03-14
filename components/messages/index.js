const authorization = require("../../middlewar/authorize");
const { Message, validateMessage } = require("./model");
const { User } = require("../users/model");
const express = require("express");
const router = express.Router();
const _ = require("lodash");

router.post("/", authorization, async (req, res) => {
  const id = req.body.receiver._id;
  const senderId = req.body.sender._id;
  const { error } = validateMessage(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let msg = new Message(
    _.pick(req.body, ["value", "sender", "receiver", "date"])
  );

  msg.save();
  const io = req.app.locals.io;
  io.emit(id, { event: "NEW_MSG", data: req.body });

  const user = await User.findById({ _id: senderId });
  const { username, email, password, contacts } = user;

  contacts.push({ _id: id, username: req.body.receiver.username });

  function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  }
  let allContacts = getUniqueListBy(contacts, "_id");

  await User.findByIdAndUpdate(
    { _id: senderId },
    {
      $set: {
        username,
        email,
        password,
        contacts: allContacts,
      },
    },
    { new: true }
  );
  await handleReceiverContacts(req.body.sender, id);
  await formatingSenderContacts(senderId, id);

  res.send({ msg });
});

router.get("/", authorization, async (req, res) => {
  const messages = await Message.find().sort("date");
  res.send(messages);
});

router.get(
  // "/conversation?user=:userId?contact=:contactId",
  "/conversation/:userId/:contactId",
  authorization,
  async (req, res) => {
    const { userId, contactId } = req.params;
    const conversation = await Message.find().select(["-__v"]).sort("date");
    const results = [];
    conversation.forEach((c) => {
      if (
        (c.sender?._id === userId && c.receiver?._id === contactId) ||
        (c.sender?._id === contactId && c.receiver?._id === userId)
      ) {
        results.push(c);
      }
    });
    // console.log("results : ", results);

    res.send(results);
  }
);

const formatingSenderContacts = async (senderId, receiverId) => {
  const sender = await User.findById({ _id: senderId });
  const receiver = await User.findById({ _id: receiverId });

  let senderContacts = sender.contacts;
  let receiverContacts = receiver.contacts;

  let array1 = [];
  let contact1 = {};
  if (senderContacts.length > 1) {
    senderContacts.forEach((c) => {
      if (c._id === receiverId) {
        contact1 = c;
      } else {
        array1.push(c);
      }
    });
    array1.unshift(contact1);
    await User.findByIdAndUpdate(
      { _id: senderId },
      {
        $set: {
          username: sender.username,
          email: sender.email,
          password: sender.password,
          contacts: array1,
        },
      },
      { new: true }
    );
  }

  let array2 = [];
  let contact2 = {};
  if (receiverContacts.length > 1) {
    receiverContacts.forEach((c) => {
      if (c._id === senderId) {
        contact2 = c;
      } else {
        array2.push(c);
      }
    });
    array2.unshift(contact2);
    await User.findByIdAndUpdate(
      { _id: receiverId },
      {
        $set: {
          username: receiver.username,
          email: receiver.email,
          password: receiver.password,
          contacts: array2,
        },
      },
      { new: true }
    );
  }
};

const handleReceiverContacts = async (sender, receiverId) => {
  let receiver = await User.findById({ _id: receiverId });
  const { username, email, password, contacts } = receiver;
  contacts.push({ _id: sender._id, username: sender.username });
  function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  }
  let allContacts = getUniqueListBy(contacts, "_id");
  await User.findByIdAndUpdate(
    { _id: receiverId },
    {
      $set: {
        username,
        email,
        password,
        contacts: allContacts,
      },
    },
    { new: true }
  );
};
module.exports = router;
