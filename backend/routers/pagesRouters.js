const express = require('express');
const {getPage,createPage,getAllPages,updatePage,toggleStarredPage,togglePageSharing,getPublicPages,getPublicPage,deletePage} = require('../controllers/pageController')
const authMiddleware = require('../middlewares/authMiddleware');
const { resolveAccountTier, enforceFreeResourceLimit } = require('../middlewares/subscriptionMiddleware');
const router = express.Router();

router.get('/',authMiddleware,resolveAccountTier,getAllPages);
router.get('/public', getPublicPages);
router.get('/public/:id', getPublicPage);
router.post('/',authMiddleware,resolveAccountTier,enforceFreeResourceLimit('page'),createPage);
router.get('/:id',authMiddleware,resolveAccountTier,getPage);
router.patch('/:id/star',authMiddleware,resolveAccountTier,toggleStarredPage);
router.patch('/:id/share',authMiddleware,resolveAccountTier,togglePageSharing);
router.put('/:id',authMiddleware,resolveAccountTier,updatePage)
router.delete('/:id',authMiddleware,resolveAccountTier,deletePage);

module.exports = router
