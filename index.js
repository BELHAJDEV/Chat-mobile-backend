const messages = require("./components/messages");
const users = require("./components/users");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});
const port = 4000;

app.use(express.json());
const corsOptions = {
  exposedHeaders: ["x-auth-token"],
  // origin : "https://blog-app-bafd3.web.app",
  // origin : "https://blog-app-bafd3.web.app",
  credentials: true,
  preflightContinue: true,
};

app.use(cors(corsOptions));

mongoose
  .connect("mongodb://127.0.0.1/Msgdb")
  .then(() => console.log("Connecting ..."))
  .catch((err) => console.error("Could not connect  : ...", err));

io.on("connect", (socket) => {
  console.log("a user connected");

  socket.emit("hello from server", "chafik");
  socket.emit("connection", "chafik belhaj");

  socket.on("hello from client", (...args) => {
    console.log("from client : ", args);
  });
});

app.use("/api/users", users);
app.use("/api/messages", messages);

app.get("/", (req, res) => {
  res.send({ text: "hello" });
  // io.emit("geting", "woow");
});

app.post("/chat", (req, res) => {
  const body = req.body;
  io.emit(body.receiver, { event: "new msg", data: body });

  res.send({ text: `new msg from ${body.sender} to ${body.receiver}` });
});

server.listen(port, () => console.log("listening on port " + port));

app.locals.io = io;
