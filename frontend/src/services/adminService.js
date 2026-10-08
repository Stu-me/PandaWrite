import api from '../api/axios'

// Groups all master-admin payment and subscription requests in one service.
export const adminService = {
  // Loads aggregate admin metrics without downloading all users to the browser.
  getOverview: () => api.get('/api/admin/overview'),
  // Requests one page of users for the scalable management table.
  getUsers: (params) => api.get('/api/admin/users', { params }),
  // Loads pending payment and support events for the notification menu.
  getNotifications: () => api.get('/api/admin/notifications'),
  // Marks a support question resolved after the admin has handled it.
  resolveQuery: (queryId) => api.patch(`/api/admin/queries/${queryId}/resolve`),
  getPaymentRequests: (status = 'pending') => api.get('/api/admin/payments', { params: { status } }),
  approvePayment: (paymentId) => api.patch(`/api/admin/payments/${paymentId}/approve`),
  rejectPayment: (paymentId, reason) => api.patch(`/api/admin/payments/${paymentId}/reject`, { reason }),
  getSubscriptions: () => api.get('/api/admin/subscriptions'),
  suspendSubscription: (userId) => api.patch(`/api/admin/subscriptions/${userId}/suspend`),
  updateUserSubscriptionStatus: (userId, action) => api.patch(`/api/admin/users/${userId}/subscription-status`, { action }),
  getBlogs: () => api.get('/api/admin/blogs'),
  updateBlogStatus: (blogId, action) => api.patch(`/api/admin/blogs/${blogId}/status`, { action }),
}
