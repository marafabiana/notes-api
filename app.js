//1 Imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Note = require("./models/Notes");

const app = express();
//Config JSON response
app.use(express.json());

//5 Models *****************************************
const User = require("./models/User");

//2 Open Route - Public Route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Welcome to the Notes API!🎉" });
});

//6 Private Route
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  //check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "User not found!" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Access denied!" });
  }

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(400).json({ msg: "Invalid token!" });
  }
}

//4 Register User **********ROTAS********************
app.post("/api/user/signup", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  //validations
  if (!name) {
    return res.status(400).json({ msg: "The name is mandatory!" });
  }

  if (!email) {
    return res.status(400).json({ msg: "The email is mandatory!" });
  }

  if (!password) {
    return res.status(400).json({ msg: "The password is mandatory!" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ msg: "The passwords do not match!" });
  }

  //check if user exists
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(400).json({ msg: "Please use another email!" });
  }

  //create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "User created successfully!" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ msg: "Server error" });
  }
});

//5 Login **********ROTAS********************
app.post("/api/user/login", async (req, res) => {
  const { email, password } = req.body;

  //validations
  if (!email) {
    return res.status(400).json({ msg: "The email is mandatory!" });
  }

  if (!password) {
    return res.status(400).json({ msg: "The password is mandatory!" });
  }

  //check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "User not found!" });
  }

  //check if password match
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(400).json({ msg: "Invalid password!" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "Authentication sent successfully!", token });
  } catch (err) {
    console.log(err);

    res.status(500).json({ msg: "Server error" });
  }
});

//6 **************************Rotas das notas *********************************
//GET
app.get("/api/notes", checkToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Note.find({ user: userId });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

//POST
app.post("/api/notes", checkToken, async (req, res) => {
  const { title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({ msg: "Text and title are mandatory!" });
  }

  try {
    newNote = new Note({
      title,
      text,
      user: req.user.id,
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

//PUT
app.put("/api/notes/:id", checkToken, async (req, res) => {
  const { title, text } = req.body;
  const noteId = req.params.id;
  const userId = req.user.id;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      { title, text, modifiedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ msg: "Note not found or user mismatch" });
    }

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

//DELETE
app.delete("/api/notes/:id", checkToken, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;

  try {
    const deletedNote = await Note.findOneAndDelete({
      _id: noteId,
      user: userId,
    });

    if (!deletedNote) {
      return res.status(404).json({ msg: "Note not found!" });
    }

    res.status(200).json({ msg: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

//3 Credencials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@notesapi.r1exgqn.mongodb.net/?retryWrites=true&w=majority&appName=NotesApi`
  )
  .then(() => {
    app.listen(3000);
    console.log("Connected to the database!🚀");
  })
  .catch((err) => console.log(err));
