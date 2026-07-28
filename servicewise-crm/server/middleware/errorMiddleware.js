export function notFound(req, res) { res.status(404).json({ success: false, message: "Not found: " + req.method + " " + req.originalUrl }); }
export function errorHandler(err, req, res, next) { if (res.headersSent) return next(err); res.status(err.statusCode || 500).json({ success: false, message: err.message || "Server error." }); }
