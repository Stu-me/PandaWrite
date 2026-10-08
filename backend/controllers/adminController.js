const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const PaymentRequest = require('../models/paymentRequestModel');
const SupportQuery = require('../models/supportQueryModel');
const Page = require('../models/pageModel');
const { getPlan } = require('../config/subscriptionPlans');

const ONLINE_WINDOW_MS = 1 * 60 * 1000;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Returns the aggregate figures shown in the summary cards without loading every user into memory.
const getAdminOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [totalUsers, activeUsers, subscribedUsers, pendingPayments, openQueries, totalEarningsResult] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', lastSeenAt: { $gte: onlineSince } }),
    Subscription.countDocuments({ status: 'active', endsAt: { $gt: now } }),
    PaymentRequest.countDocuments({ status: 'pending' }),
    SupportQuery.countDocuments({ status: 'open' }),
    PaymentRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
  ]);

  const totalEarnings = totalEarningsResult[0]?.total || 0;

  return res.status(200).json({ 
    totalUsers, 
    activeUsers, 
    subscribedUsers, 
    pendingApprovals: pendingPayments, 
    openQueries, 
    totalEarnings 
  });
});

// Returns one paginated admin-friendly row per user, including their current subscription and latest payment request.
const getAdminUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const search = req.query.search?.trim();
  const match = { role: 'user' };
  if (search) match.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const [result] = await User.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $facet: {
      rows: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: { from: 'subscriptions', localField: '_id', foreignField: 'user', as: 'subscription' } },
        { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'paymentrequests', let: { userId: '$_id' }, pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
          { $sort: { createdAt: -1 } }, { $limit: 1 },
        ], as: 'latestPayment' } },
        { $unwind: { path: '$latestPayment', preserveNullAndEmptyArrays: true } },
        { $project: { name: 1, email: 1, lastSeenAt: 1, createdAt: 1, 'subscription.plan': 1, 'subscription.status': 1, 'subscription.endsAt': 1, 'latestPayment._id': 1, 'latestPayment.status': 1, 'latestPayment.plan': 1 } },
      ],
      total: [{ $count: 'count' }],
    } },
  ]);

  const onlineSince = Date.now() - ONLINE_WINDOW_MS;
  const users = result.rows.map((user) => ({
    ...user,
    presence: user.lastSeenAt && new Date(user.lastSeenAt).getTime() >= onlineSince ? 'online' : 'offline',
  }));
  return res.status(200).json({ users, page, limit, total: result.total[0]?.count || 0 });
});

// Supplies the notification drawer with the newest payment approvals and open support questions.
const getAdminNotifications = asyncHandler(async (req, res) => {
  const [payments, queries] = await Promise.all([
    PaymentRequest.find({ status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
    SupportQuery.find({ status: 'open' }).populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
  ]);
  const notifications = [
    ...payments.map((payment) => ({ id: payment._id, type: 'payment', createdAt: payment.createdAt, title: 'Payment approval requested', detail: `${payment.user?.name || 'A user'} submitted a ${payment.plan} plan payment.` })),
    ...queries.map((query) => ({ id: query._id, type: 'query', createdAt: query.createdAt, title: query.subject, detail: `${query.user?.name || 'A user'} raised a support query.` })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.status(200).json(notifications);
});

// Resolves a support question without deleting the record, preserving a small audit trail.
const resolveSupportQuery = asyncHandler(async (req, res) => {
  const query = await SupportQuery.findOneAndUpdate(
    { _id: req.params.id, status: 'open' },
    { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() },
    { new: true },
  );
  if (!query) {
    res.status(404);
    throw new Error('Open support query not found');
  }
  return res.status(200).json(query);
});

// Updates user subscription status to pending, approved, declined, or suspended.
const updateUserSubscriptionStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // 'approve', 'decline', 'suspend', 'pending'

  if (!['approve', 'decline', 'suspend', 'pending'].includes(action)) {
    res.status(400);
    throw new Error('Invalid action. Must be approve, decline, suspend, or pending.');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let latestPayment = await PaymentRequest.findOne({ user: userId }).sort({ createdAt: -1 });

  if (action === 'approve') {
    if (!latestPayment) {
      latestPayment = await PaymentRequest.create({
        user: userId,
        plan: 'monthly',
        amount: 99,
        transactionId: `MANUAL-APP-${userId}-${Date.now()}`,
        status: 'pending',
      });
    } else if (latestPayment.status !== 'pending') {
      latestPayment.status = 'pending';
      await latestPayment.save();
    }

    const plan = getPlan(latestPayment.plan) || { durationDays: 30 };
    const now = new Date();
    const currentSubscription = await Subscription.findOne({ user: userId });
    const startsAt = currentSubscription?.status === 'active' && currentSubscription.endsAt > now
      ? currentSubscription.endsAt
      : now;

    const subscription = await Subscription.findOneAndUpdate(
      { user: userId },
      {
        plan: latestPayment.plan,
        status: 'active',
        startsAt,
        endsAt: addDays(startsAt, plan.durationDays),
        approvedBy: req.user._id,
        paymentRequest: latestPayment._id,
      },
      { new: true, upsert: true, runValidators: true },
    );

    latestPayment.status = 'approved';
    latestPayment.reviewedBy = req.user._id;
    latestPayment.reviewedAt = now;
    latestPayment.rejectionReason = undefined;
    await latestPayment.save();

    return res.status(200).json({ success: true, latestPayment, subscription });
  }

  if (action === 'decline') {
    if (!latestPayment) {
      latestPayment = await PaymentRequest.create({
        user: userId,
        plan: 'monthly',
        amount: 99,
        transactionId: `MANUAL-DEC-${userId}-${Date.now()}`,
        status: 'pending',
      });
    }

    latestPayment.status = 'rejected';
    latestPayment.reviewedBy = req.user._id;
    latestPayment.reviewedAt = new Date();
    latestPayment.rejectionReason = 'Manually declined by administrator';
    await latestPayment.save();

    const subscription = await Subscription.findOne({ user: userId });
    if (subscription) {
      subscription.status = 'expired';
      await subscription.save();
    }

    return res.status(200).json({ success: true, latestPayment, subscription });
  }

  if (action === 'suspend') {
    let subscription = await Subscription.findOne({ user: userId });
    if (!subscription) {
      if (!latestPayment) {
        latestPayment = await PaymentRequest.create({
          user: userId,
          plan: 'monthly',
          amount: 99,
          transactionId: `MANUAL-SUS-${userId}-${Date.now()}`,
          status: 'approved',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        });
      }
      subscription = await Subscription.create({
        user: userId,
        plan: latestPayment.plan,
        status: 'suspended',
        startsAt: new Date(),
        endsAt: new Date(),
        approvedBy: req.user._id,
        paymentRequest: latestPayment._id,
      });
    } else {
      subscription.status = 'suspended';
      await subscription.save();
    }

    return res.status(200).json({ success: true, latestPayment, subscription });
  }

  if (action === 'pending') {
    if (!latestPayment) {
      latestPayment = await PaymentRequest.create({
        user: userId,
        plan: 'monthly',
        amount: 99,
        transactionId: `MANUAL-PEN-${userId}-${Date.now()}`,
        status: 'pending',
      });
    } else {
      latestPayment.status = 'pending';
      latestPayment.reviewedBy = undefined;
      latestPayment.reviewedAt = undefined;
      latestPayment.rejectionReason = undefined;
      await latestPayment.save();
    }

    const subscription = await Subscription.findOne({ user: userId });
    if (subscription) {
      subscription.status = 'expired';
      await subscription.save();
    }

    return res.status(200).json({ success: true, latestPayment, subscription });
  }
});

const getAdminBlogs = asyncHandler(async (_req, res) => {
  const blogs = await Page.find({ isShared: true }).populate('createdBy', 'name email').sort({ updatedAt: -1 });
  return res.status(200).json(blogs);
});

const updateBlogStatus = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['suspend', 'restore'].includes(action)) { res.status(400); throw new Error('Action must be suspend or restore'); }
  const page = await Page.findById(req.params.id);
  if (!page || !page.isShared) { res.status(404); throw new Error('Shared blog not found'); }
  page.blogStatus = action === 'suspend' ? 'suspended' : 'published';
  page.suspendedAt = action === 'suspend' ? new Date() : undefined;
  page.suspendedBy = action === 'suspend' ? req.user._id : undefined;
  await page.save();
  return res.status(200).json(page);
});

module.exports = { 
  getAdminOverview, 
  getAdminUsers, 
  getAdminNotifications, 
  resolveSupportQuery,
  updateUserSubscriptionStatus,
  getAdminBlogs,
  updateBlogStatus,
};
