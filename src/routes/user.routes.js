const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');

// GET    /api/v1/users         — get all users
// POST   /api/v1/users         — create a new user
// GET    /api/v1/users/:id     — get one user by ID
// PUT    /api/v1/users/:id     — update a user
// DELETE /api/v1/users/:id     — delete a user

router.get('/', UserController.getAll);
router.post('/', validate.createUser, UserController.create);
router.get('/:id', validate.validateUUID, UserController.getById);
router.put('/:id', validate.validateUUID, validate.createUser, UserController.update);
router.delete('/:id', validate.validateUUID, UserController.delete);

module.exports = router;