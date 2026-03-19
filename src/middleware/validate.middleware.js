const validate = {
  // Validates the body when creating a new user
  createUser: (req, res, next) => {
    const { username, email } = req.body;

    // Check both fields exist and aren't empty strings
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'username and email are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Basic email format check using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        timestamp: new Date().toISOString(),
      });
    }

    // Username: letters, numbers, underscores only, 3-30 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, or underscores',
        timestamp: new Date().toISOString(),
      });
    }

    // Sanitize — trim whitespace before passing to controller
    req.body.username = username.trim();
    req.body.email = email.trim().toLowerCase();

    // next() means "this middleware is done, move to the controller"
    next();
  },

  // Validates the body when creating a new API key
  createApiKey: (req, res, next) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'API key name must be between 3 and 50 characters',
        timestamp: new Date().toISOString(),
      });
    }

    req.body.name = name.trim();
    next();
  },

  // Validates that a UUID in the URL params is actually a valid UUID
  validateUUID: (req, res, next) => {
    const { id, userId } = req.params;
    const uuidToCheck = id || userId;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuidToCheck)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format — must be a valid UUID',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  },
};

module.exports = validate;