import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized, Login Again",
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // decoded id-ti body-te assign kora hocche jate poroborti controller-e pawa jay
    req.body.userId = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    // Token expired ba invalid hole error handle korar jonno
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
