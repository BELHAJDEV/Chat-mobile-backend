const authorization = require("../../middlewar/authorize");
const { User, validateUser, isEmailAndPassword } = require("./model");
const _ = require("lodash");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.get("/getUsers/:id", authorization, async (req, res) => {
  const { id } = req.params;
  const data = [];
  const users = await User.find().select([
    "-password",
    "-contacts",
    "-__v",
    "-email",
  ]);
  users.forEach((user) => {
    if (user["_id"] + "" != id) {
      data.push(user);
      // console.log(user["_id"] + "");
    }
  });

  res.send(data);
});
router.get("/me", authorization, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.get("/contacts/:id", authorization, async (req, res) => {
  const { id } = req.params;
  console.log("id : ", id);
  const user = await User.findById(id);
  if (!user) return;

  console.log(user);

  if (user.contacts) res.send(user.contacts);
  res.send([]);
});

router.post("/register", async (req, res) => {
  const body = req.body;
  const { error } = validateUser(body);
  if (error) return res.status(400).send(error.details[0].message);
  let user = await User.findOne({ email: body.email });
  if (user) return res.status(400).send("User already registered.");
  user = new User(_.pick(req.body, ["username", "email", "password", "image"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.save();
  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "username", "email", "image"]));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { error } = isEmailAndPassword(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email or password.");

  const passwordCorrect = await bcrypt.compare(password, user.password);
  if (!passwordCorrect)
    return res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send(token);
});

router.post("/refershToken", async (req, res) => {
  const token = req.header("x-auth-token");

  // console.log("refresh request : ", token);
  if (!token) return res.status(401).send("Access denied. No token provided.");
  const decodedToken = jwt.verify(token, process.env.JWT_KEY, {
    ignoreExpiration: true,
  });
  const { _id, username, contacts } = decodedToken;
  console.log("_id : ", _id);
  const newToken = jwt.sign(
    {
      _id,
      username,
      contacts,
    },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );
  res.send(newToken);
});
module.exports = router;
