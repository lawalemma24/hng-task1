const express = require('express');
const controller = require('../controller/profileController');
const router = express.Router();
router.post('/', controller.createProfile);
router.get('/', controller.getAllProfiles);
router.get('/:id', controller.getProfile);
router.delete('/:id', controller.deleteProfile);

module.exports = router;