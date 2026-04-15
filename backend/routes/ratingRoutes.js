const express = require('express');
const router = express.Router();
const { rateSeller, getSellerRatings } = require('../controllers/wishlistRatingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, rateSeller);
router.get('/seller/:sellerId', getSellerRatings);

module.exports = router;
