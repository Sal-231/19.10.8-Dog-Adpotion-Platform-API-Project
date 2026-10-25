const { Router } =  require('express')
const authcontroller = require('../controllers/authController')

const router = Router();

router.get('/signup', authcontroller.signup_get);
router.post('/signup', authcontroller.signup_post);
router.get('/login', authcontroller.login_get);
router.post('/login', authcontroller.login_post);
router.get('/logout', authcontroller.logout_get);

module.exports = router;