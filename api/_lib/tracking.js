// Maps public.order_status (see supabase/migrations/20260329120000_gadgetboss_sync_core.sql:
// PENDING, CONFIRMED, PROCESSING, DISPATCHED, DELIVERED, CANCELLED, COMPLETED)
// onto a simple delivery timeline for the account page.
const STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'processing', label: 'Preparing your order' },
  { key: 'dispatched', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_RANK = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  DISPATCHED: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

function buildTracking(order) {
  const status = String((order && order.status) || 'PENDING').toUpperCase();
  const placedAt = (order && order.created_at) || null;
  const updatedAt = (order && order.updated_at) || null;
  const cancelled = status === 'CANCELLED';
  const rank = cancelled ? 0 : STATUS_RANK[status];
  const reached = typeof rank === 'number' ? rank : 0;

  const steps = STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    done: !cancelled && index <= reached,
    // Only two timestamps exist on the row, so we attribute created_at to
    // "placed" and updated_at to whichever step the order currently sits on.
    at: index === 0 ? placedAt : !cancelled && index === reached ? updatedAt || placedAt : null,
  }));

  if (cancelled) {
    steps[0].done = true;
    steps.push({ key: 'cancelled', label: 'Cancelled', done: true, at: updatedAt || placedAt });
  }

  return { status, placedAt, steps };
}

module.exports = { STEPS, STATUS_RANK, buildTracking };
