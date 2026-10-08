const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireMasterAdmin } = require('../middlewares/subscriptionMiddleware');
const {
  getPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  getSubscriptions,
  suspendSubscription,
} = require('../controllers/paymentController');
const { getAdminOverview, getAdminUsers, getAdminNotifications, resolveSupportQuery, updateUserSubscriptionStatus, getAdminBlogs, updateBlogStatus } = require('../controllers/adminController');

// Admin-only routes: every route below requires authentication and master-admin role.
const router = express.Router();

router.use(authMiddleware, requireMasterAdmin);
router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.get('/notifications', getAdminNotifications);
router.patch('/queries/:id/resolve', resolveSupportQuery);
router.patch('/users/:userId/subscription-status', updateUserSubscriptionStatus);
router.get('/blogs', getAdminBlogs);
router.patch('/blogs/:id/status', updateBlogStatus);
router.get('/payments', getPaymentRequests);
router.patch('/payments/:id/approve', approvePaymentRequest);
router.patch('/payments/:id/reject', rejectPaymentRequest);
router.get('/subscriptions', getSubscriptions);
router.patch('/subscriptions/:userId/suspend', suspendSubscription);

module.exports = router;
