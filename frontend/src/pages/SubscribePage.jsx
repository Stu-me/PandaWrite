import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { paymentService } from '../services/paymentService'
import { supportService } from '../services/supportService'
import { useSubscription } from '../hooks/useSubscription'

// Formats dates returned by MongoDB into a readable local date.
function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

// Gives each payment/subscription state a clear visual label.
function statusStyle(status) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-red-100 text-red-700',
    expired: 'bg-gray-200 text-gray-700',
  }
  return styles[status] || 'bg-gray-100 text-gray-700'
}

function SubscribePage() {
  const [searchParams] = useSearchParams()
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription()
  const [plans, setPlans] = useState({})
  const [freeTier, setFreeTier] = useState(null)
  const [paymentRequests, setPaymentRequests] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [transactionId, setTransactionId] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [querySubject, setQuerySubject] = useState('')
  const [queryMessage, setQueryMessage] = useState('')
  const [submittingQuery, setSubmittingQuery] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(() => {
    if (searchParams.get('reason') !== 'free-limit') return ''
    const resource = searchParams.get('resource') || 'resource'
    const limit = searchParams.get('limit')
    return limit
      ? `You reached the free-plan limit of ${limit} ${resource}${limit === '1' ? '' : 's'}. Upgrade to create more.`
      : 'You reached a free-plan limit. Upgrade to create more.'
  })

  const paymentAccountName = import.meta.env.VITE_PAYMENT_RECEIVER_NAME || 'the app administrator'
  const paymentUpiId = import.meta.env.VITE_PAYMENT_UPI_ID

  // Loads plans and payment history; subscription state is cached in SubscriptionProvider.
  const loadSubscriptionData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansRes, requestsRes] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getMyRequests(),
      ])
      const paidPlans = plansRes.data.paidPlans || plansRes.data
      setPlans(paidPlans)
      setFreeTier(plansRes.data.free || null)
      setPaymentRequests(requestsRes.data)

      if (!paidPlans[selectedPlan]) {
        setSelectedPlan(Object.keys(paidPlans)[0] || '')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load subscription information')
    } finally {
      setLoading(false)
    }
  }, [selectedPlan])

  useEffect(() => {
    // This starts asynchronous API requests; state changes happen after responses arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSubscriptionData()
  }, [loadSubscriptionData])

  const latestRequest = paymentRequests[0]
  const hasPendingRequest = latestRequest?.status === 'pending'
  const currentPlan = useMemo(() => plans[selectedPlan], [plans, selectedPlan])
  const hasActiveSubscription = subscription?.status === 'active'

  // Submits a transaction reference for manual verification; it never activates access directly.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      await paymentService.createManualRequest({
        plan: selectedPlan,
        transactionId,
        proofUrl: proofUrl || undefined,
      })
      setTransactionId('')
      setProofUrl('')
      setMessage('Payment request submitted. Access will activate after admin verification.')
      await Promise.all([loadSubscriptionData(), refreshSubscription()])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit the payment request')
    } finally {
      setSubmitting(false)
    }
  }

  // Sends a support question to the admin notification queue without mixing it with payment requests.
  const handleSupportQuery = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmittingQuery(true)
    try {
      await supportService.createQuery({ subject: querySubject, message: queryMessage })
      setQuerySubject('')
      setQueryMessage('')
      setMessage('Your question was sent to the administrator.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send your question')
    } finally {
      setSubmittingQuery(false)
    }
  }

  if (loading || subscriptionLoading) return <div className="p-6 text-[var(--text-secondary)]">Loading subscription options...</div>

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8 bg-[var(--bg)] min-h-screen">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Subscription</p>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Choose your plan</h1>
          <p className="text-[var(--text-secondary)] mt-2">Pay manually, then submit the transaction reference for review.</p>
        </div>
        <div className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${statusStyle(hasActiveSubscription ? 'active' : 'free')}`}>
            {hasActiveSubscription ? 'active' : 'free'}
          </div>
      </section>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      {hasActiveSubscription && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-800">
          <p className="font-semibold">Your subscription is active.</p>
          <p className="text-sm mt-1 text-green-700">Access remains available until {formatDate(subscription.endsAt)}.</p>
        </section>
      )}

      {!hasActiveSubscription && freeTier && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <p className="font-semibold text-[var(--text-primary)]">You are currently using the Free plan.</p>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">You can keep using the app within the limits shown below, or upgrade for unrestricted access.</p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {freeTier && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
            <p className="text-lg font-bold text-[var(--text-primary)]">{freeTier.name}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--accent)]">₹0</p>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><span className="text-[var(--accent)]">•</span> {freeTier.limits.workspaces} workspace</li>
              <li className="flex items-center gap-2"><span className="text-[var(--accent)]">•</span> {freeTier.limits.pagesPerWorkspace} pages per workspace</li>
              <li className="flex items-center gap-2"><span className="text-[var(--accent)]">•</span> {freeTier.limits.blocksPerPage} blocks per page</li>
              <li className="flex items-center gap-2"><span className="text-[var(--accent)]">•</span> All current block types</li>
            </ul>
          </div>
        )}
        {Object.entries(plans).map(([planName, plan]) => (
          <button
            type="button"
            key={planName}
            onClick={() => setSelectedPlan(planName)}
            className={`relative overflow-hidden rounded-xl border p-6 text-left transition bg-[var(--bg-card)] ${
              selectedPlan === planName ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)] shadow-[var(--shadow-card)]' : 'border-[var(--border)] hover:border-[var(--accent)] shadow-sm'
            }`}
          >
            {plan.badge && <span className={`absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-xs font-bold ${planName === 'quarterly' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--gold-light)] text-[var(--gold)]'}`}>{plan.badge}</span>}
            <p className="text-lg font-bold text-[var(--text-primary)]">{plan.name || planName}</p>
            <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">₹{plan.amount}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{plan.durationDays} days of access</p>
            {plan.savings && <p className="mt-3 inline-flex rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">{plan.savings}</p>}
            <p className="mt-4 min-h-10 text-sm leading-5 text-[var(--text-secondary)]">{plan.description}</p>
            <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
              {(plan.highlights || ['Unlimited access']).map((highlight) => <li key={highlight} className="flex gap-2"><span className="font-bold text-[var(--accent)]">✓</span>{highlight}</li>)}
            </ul>
          </button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Make your payment</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Send ₹{currentPlan?.amount ?? '—'} to {paymentAccountName}.</p>
          {paymentUpiId ? (
            <p className="mt-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3 font-mono text-sm text-[var(--text-primary)]">UPI ID: {paymentUpiId}</p>
          ) : (
            <p className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              Payment details have not been configured yet. Contact the administrator before submitting a request.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Submit payment for review</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">The admin will verify the payment before activating access.</p>

          <label className="block mt-4 text-sm font-medium text-[var(--text-primary)]">Transaction/reference ID</label>
          <input
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            required
            disabled={hasPendingRequest || submitting}
            placeholder="Example: UPI transaction ID"
            className="mt-1 w-full rounded-xl border border-[var(--border)] p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition disabled:bg-[var(--bg)]"
          />

          <label className="block mt-4 text-sm font-medium text-[var(--text-primary)]">Payment proof URL <span className="text-[var(--text-secondary)] font-normal">(optional)</span></label>
          <input
            type="url"
            value={proofUrl}
            onChange={(event) => setProofUrl(event.target.value)}
            disabled={hasPendingRequest || submitting}
            placeholder="https://..."
            className="mt-1 w-full rounded-xl border border-[var(--border)] p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition disabled:bg-[var(--bg)]"
          />

          {hasPendingRequest && <p className="mt-3 text-sm text-yellow-700">You already have a request waiting for review.</p>}

          <button
            type="submit"
            disabled={!currentPlan || hasPendingRequest || submitting}
            className="mt-5 w-full rounded-xl bg-[var(--accent)] py-2.5 text-[var(--text-on-accent)] font-semibold transition hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : subscription?.status === 'active' ? 'Submit renewal request' : 'Submit payment request'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Payment history</h2>
        </div>
        {paymentRequests.length === 0 ? (
          <p className="p-5 text-sm text-[var(--text-secondary)]">No payment requests submitted yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {paymentRequests.map((request) => (
              <div key={request._id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)] capitalize">{request.plan} — ₹{request.amount}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Reference: {request.transactionId} · Submitted {formatDate(request.createdAt)}</p>
                  {request.rejectionReason && <p className="mt-1 text-sm text-red-600">Reason: {request.rejectionReason}</p>}
                </div>
                <span className={`w-fit rounded-full px-4 py-1.5 text-sm font-medium capitalize ${statusStyle(request.status)}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleSupportQuery} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Need help?</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Send a question directly to the administrator.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={querySubject} onChange={(event) => setQuerySubject(event.target.value)} maxLength="120" required placeholder="Question subject" className="rounded-xl border border-[var(--border)] p-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)]" />
          <button disabled={submittingQuery} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50">{submittingQuery ? 'Sending...' : 'Send question'}</button>
        </div>
        <textarea value={queryMessage} onChange={(event) => setQueryMessage(event.target.value)} maxLength="2000" required placeholder="Describe what you need help with" className="mt-3 min-h-24 w-full rounded-xl border border-[var(--border)] p-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)]" />
      </form>
    </main>
  )
}

export default SubscribePage
