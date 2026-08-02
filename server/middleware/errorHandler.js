export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500)
  const message = error.name === 'ValidationError' ? Object.values(error.errors).map(item => item.message).join(', ') : error.message || 'Server error'
  res.status(statusCode).json({ success: false, message })
}
