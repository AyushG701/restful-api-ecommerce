const User = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const config = require("../config/config.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const sendRestPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    // might be error in the email url check later
    const mailOptions = {
      to: config.emailUser,
      from: "passwordreset@example.com", // Your email or domain
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
               Please click on the following link, or paste this into your browser to complete the process:\n\n
               http://${req.headers.host}/reset-password/${resetToken}\n\n
               If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
    await transporter.sendMail(mailOptions, function (error, inform) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent successfully", info.response);
      }
    });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

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

//update password method
const update_password = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const password = req.body.password;
    const data = await User.findOne({ _id: user_id });
    if (data) {
      const newPassword = await securePassword(password);
      const userData = await User.findByIdAndUpdate(
        { _id: user_id },
        {
          $set: {
            password: newPassword,
          },
        },
      );
      res.status(200).send({
        success: true,
        msg: "your password has been successfully changed",
      });
    } else {
      res.status(200).send({ success: false, msg: "USer Id not found" });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const forget_password = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: req.body.email });

    if (userData) {
      const randomString = randomstring.generate();
      const data = await User.updateOne(
        { email: email },
        { $set: { token: randomString } },
      );
      sendRestPasswordMail(userData.name, userData.email, randomString);
      res.status(200).send({
        success: true,
        msg: "please check your inbox mail and rest your password",
      });
    } else {
      res
        .status(200)
        .send({ success: true, msg: "this email does not exists" });
    }
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const reset_password = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      const password = req.body.password;
      const newPassword = await securePassword(password);
      const userData = await User.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: newPassword, token: "" } },
        { new: true },
      );

      res
        .status(200)
        .send({
          success: true,
          msg: "Password has been successfully reset",
          data: userData,
        });
    } else {
      res.status(400).send({ success: false, msg: "Invalid or expired token" });
    }
  } catch (error) {
    res.status(500).send({ success: false, msg: error.message });
  }
};

module.exports = {
  register_user,
  login_user,
  update_password,
  forget_password,
  reset_password,
};
