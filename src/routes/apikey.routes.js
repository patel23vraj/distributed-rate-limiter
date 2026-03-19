const express = require('express');
const router = express.Router({ mergeParams: true });
const ApiKeyController = require('../controllers/apikey.controller');
const validate = require('../middleware/validate.middleware');

// GET    /api/v1/users/:userId/keys      — get all keys for a user
// POST   /api/v1/users/:userId/keys      — create a key for a user
// PATCH  /api/v1/keys/:id/status         — activate/deactivate a key
// DELETE /api/v1/keys/:id               — delete a key

router.get('/', validate.validateUUID, ApiKeyController.getByUserId);
router.post('/', validate.validateUUID, validate.createApiKey, ApiKeyController.create);

module.exports = router;