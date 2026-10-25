const { Router } = require('express');
const dogController = require('../controllers/dogController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/dogs', requireAuth, dogController.register_post);
router.post('/dogs/:id/adopt', requireAuth, dogController.adopt_post);
router.delete('/dogs/:id', requireAuth, dogController.delete_dog);
router.get('/dogs/mine', requireAuth, dogController.get_my_dogs);
router.get('/dogs/adopted', requireAuth, dogController.get_adopted_dogs);

module.exports = router;