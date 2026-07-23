export function notFound(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || response.statusCode || 500;

  response.status(statusCode).json({
    success: false,
    message: error.message || "Unexpected server error.",
  });
}
