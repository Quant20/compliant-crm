export function requireApiKey(request, response, next) {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    return next();
  }

  const providedKey = request.header("x-api-key");

  if (providedKey !== configuredKey) {
    return response.status(401).json({
      success: false,
      message: "Invalid or missing API key.",
    });
  }

  return next();
}
