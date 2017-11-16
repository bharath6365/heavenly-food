const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const {catchErrors} = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));

router.get('/stores', catchErrors(storeController.getStores));

router.get('/stores/page/:page', catchErrors(storeController.getStores));

router.get('/add', 
authController.isLoggedIn,
storeController.addStore
);


router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags',catchErrors(storeController.getStoresByTag));

router.get('/tags/:tag',catchErrors(storeController.getStoresByTag));

router.post('/add',
 storeController.photoUpload,
 catchErrors(storeController.photoResize),
 catchErrors(storeController.createStore)
);

router.post('/add/:id',
  storeController.photoUpload,
  catchErrors(storeController.photoResize),
  catchErrors(storeController.updateStore)
);

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);
// 1. We need to validate registration data (Client , Model ,Express Validator)
// 2. Save user to database
// 3. Login the user
router.post('/register', 
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account',
  authController.isLoggedIn,
  userController.account
)

router.post('/account',catchErrors(userController.updateAccount));

router.post('/account/forgot',catchErrors(authController.forgot));

router.get('/account/reset/:token',catchErrors(authController.resetPassword));

router.post('/account/reset/:token',
authController.confirmPasswords,
catchErrors(authController.updatePassword)
);

// Hearts

router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));

// Reviews
router.post('/reviews/:id',authController.isLoggedIn, catchErrors(reviewController.addReview))

router.get('/top', catchErrors(storeController.getTopStores));

// Api end points

router.get('/api/search', catchErrors(storeController.searchStores));

router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));




module.exports = router;
