const jwt = require("jsonwebtoken");
const config = require("../config/config");

const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];
  if (!token) {
    res.status(200).send({
      success: false,
      msg: "A token is required for the authentication",
    });
  }
  try {
    const decoded = jwt.verify(token, config.secret_jwt);
    req.user = decoded;
  } catch (error) {
    res.status(200).send({ success: false, msg: "Invalid Token" });
  }
  return next();
};

module.exports = verifyToken;
