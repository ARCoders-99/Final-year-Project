export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();
  
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 👈 ADD THIS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 👈 ADD THIS (CRITICAL)
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user,
      message,
      token,
    });
};