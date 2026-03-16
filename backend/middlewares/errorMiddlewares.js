class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}


export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Interal Server Error";
  err.statusCode = err.statusCode || 500;


  if (err.name === "ZodError") {
    const statusCode = 400;
    const message = err.issues.map((issue) => issue.message).join(" ");
    err = new ErrorHandler(message, statusCode);
  } else if (err.code === 11000) {
    const statusCode = 400;
    const message = "Duplicate Field Value Entered";
    err = new ErrorHandler(message, statusCode);
  }

  if (err.name === "JsonWebTokenError") {
    const statusCode = 400;
    const message = "Json Wen Token is Invalid. Try again";
    err = new ErrorHandler(message, statusCode);
  }
  if (err.name === "JsonWebExpiredError") {
    const statusCode = 400;
    const message = "Json Wen Token is expired. Try again";
    err = new ErrorHandler(message, statusCode);
  }

  if (err.name === "CastError") {
    const statusCode = 400;
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, statusCode);
  }

  const errorMessage = err.errors
    ? Object.values(err.errors)
      .map((error) => error.message)
      .join(" ")
    : err.message;

  return res.status(err.statusCode).json({
    success: false,
    message: errorMessage,
  })
};


export default ErrorHandler;