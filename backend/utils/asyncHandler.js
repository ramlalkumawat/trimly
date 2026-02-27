// Wraps async Express handlers and forwards thrown errors to next().
// wrapper to catch async errors and pass to error handler
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
