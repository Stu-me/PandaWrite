// The backend owns plan prices and durations so users cannot alter them in requests.
const SUBSCRIPTION_PLANS = Object.freeze({
  // Telecom-inspired validity choices, adapted to Pandawrite's unlimited product access.
  monthly: {
    name: 'Monthly', amount: 299, durationDays: 30, badge: 'Flexible',
    description: 'Try unlimited Pandawrite for one month.',
    highlights: ['Unlimited workspaces', 'Unlimited pages and blocks', 'All media block types'],
  },
  quarterly: {
    name: 'Quarterly', amount: 799, durationDays: 90, badge: 'Most popular', savings: 'Save ₹98',
    description: 'Three months of uninterrupted focus.',
    highlights: ['Everything in Monthly', 'Priority support queue', 'Best short-term value'],
  },
  yearly: {
    name: 'Yearly', amount: 2999, durationDays: 365, badge: 'Best value', savings: 'Save ₹589',
    description: 'One full year to build your second brain.',
    highlights: ['Everything in Quarterly', '365 days of access', 'Lowest cost per month'],
  },
});

// Default free-tier limits. Adjust these values here when the product rules change.
const FREE_TIER = Object.freeze({
  name: 'Free',
  limits: {
    workspaces: 3,
    pagesPerWorkspace: 5,
    blocksPerPage: 20,
  },
  // All current block types remain free. Add future premium-only types separately.
  blockTypes: ['text', 'heading', 'todo', 'image', 'audio', 'youtube', 'document'],
});

// Returns the trusted plan configuration for a submitted plan name.
function getPlan(plan) {
  return SUBSCRIPTION_PLANS[plan];
}

module.exports = { SUBSCRIPTION_PLANS, FREE_TIER, getPlan };
