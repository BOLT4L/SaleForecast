const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logger = require("../utils/logger");

const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  try {
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "Planner",
    });

    await user.save();
    logger.info(`User created by admin: ${username}, role: ${role}`);
    res.status(201).json({
      message: "User created",
      user: { id: user._id, username, email, role },
    });
  } catch (error) {
    logger.error(`Create user error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const getUsers = async (req, res) => {
  const { role } = req.query;
  const query = {};
  if (role) {
    query.role = role;
  }

  try {
    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (role) user.role = role;

    await user.save();
    logger.info(`User updated by admin: ${user.username}`);
    res.json({
      message: "User updated",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "Admin") {
      return res.status(403).json({ error: "Cannot delete admin user" });
    }

    await User.deleteOne({ _id: req.params.id });
    logger.info(`User deleted by admin: ${user.username}`);
    res.json({ message: "User deleted" });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createUser, getUsers, updateUser, deleteUser };
