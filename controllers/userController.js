const User = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const config = require("../config/config.js");
const jwt = require("jsonwebtoken");

const create_token = async (id) => {
  try {
    const token = await jwt.sign({ _id: id }, config.secret_jwt);
    return token;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const register_user = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,
      image: req.file.filename,
      type: req.body.type,
    });

    const userData = await User.findOne({ email: req.body.email });
    if (userData) {
      res
        .status(400)
        .send({ sucess: false, msg: "this email is already exists" });
    } else {
      const user_data = await user.save();
      res.status(201).send({ sucess: true, data: user_data });
    }
  } catch (error) {
    res.status(400).send(error.message);
    console.log(error.message);
  }
};

// login method
const login_user = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const isMatch = await bcryptjs.compare(password, userData.password);
      if (isMatch) {
        const tokenData = await create_token(userData._id);
        const userResult = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          mobile: userData.mobile,
          image: userData.image,
          type: userData.type,
          token: tokenData,
        };
        const response = {
          success: true,
          msg: "userDetails",
          data: userResult,
        };
        res.status(200).send(response);
      } else {
        res.status(400).send({ sucess: false, msg: "password is incorrect" });
      }
    } else {
      const user_data = await user.save();
      res
        .status(400)
        .send({ sucess: false, msg: "login details are incorret" });
    }
  } catch (error) {
    res.status(400).send(error.message);
    console.log(error.message);
  }
};

module.exports = {
  register_user,
  login_user,
};
