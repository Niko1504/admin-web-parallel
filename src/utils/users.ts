/**
 * User aggregation derived from the existing orders feed.
 *
 * The shared backend (api.washio.app) does NOT expose an admin endpoint that
 * lists customer accounts from `db.users`. The only customer-facing data the
 * admin API returns is the order list (`GET /orders`), whose documents pass
 * through every stored field — including `user_phone` and `user_deleted`.
 *
 * So we reconstruct a practical "users" view by grouping orders per phone.
 *
 * Known, intentional limitations (surfaced in the UI, never faked):
 *  - A user who registered via OTP but never placed an order is invisible here,
 *    because no admin API exposes `db.users`.
 *  - `registeredAt` is the user's FIRST order time, an approximation of the real
 *    registration timestamp (which lives only on the unexposed user document).
 *  - `cars` are derived from orders, not from the user's saved garage (`db.cars`,
 *    also unexposed).
 *  - `isDeleted` is inferred from the `user_deleted` flag the backend stamps on
 *    orders when an account is deleted; a deleted user with zero orders leaves
 *    no trace at all.
 */

export interface AggregatedUserCar {
  name: string;
  plate: string;
}

export interface AggregatedUser {
  /** Phone number — the stable key for a customer across orders. */
  phone: string;
  /** Number of orders this customer has placed. */
  ordersCount: number;
  /** Earliest order timestamp (ISO string) — approximates registration time. */
  registeredAt: string | null;
  /** Most recent order timestamp (ISO string). */
  lastOrderAt: string | null;
  /** Status of the most recent order. */
  lastStatus: string | null;
  /** Distinct cars seen across this customer's orders. */
  cars: AggregatedUserCar[];
  /** Sum of order prices (only orders that carry a numeric price). */
  totalSpent: number;
  /** True if any of the customer's orders is flagged `user_deleted` by the backend. */
  isDeleted: boolean;
}

/** Minimal shape we rely on from an order document. */
export interface OrderLike {
  client_phone?: string;
  user_phone?: string;
  created_at?: string | null;
  scheduled_time?: string | null;
  status?: string;
  car_name?: string | null;
  car_plate?: string | null;
  price?: number | null;
  user_deleted?: boolean;
}

function timeOf(value: string | null | undefined): number {
  if (!value) return NaN;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/**
 * Aggregate a flat list of orders into one entry per customer phone.
 * Result is sorted by last activity, newest first.
 */
export function aggregateUsers(orders: OrderLike[]): AggregatedUser[] {
  const byPhone = new Map<string, AggregatedUser & { _carKeys: Set<string> }>();

  for (const order of orders ?? []) {
    const phone = (order.user_phone || order.client_phone || '').trim();
    if (!phone) continue;

    let user = byPhone.get(phone);
    if (!user) {
      user = {
        phone,
        ordersCount: 0,
        registeredAt: null,
        lastOrderAt: null,
        lastStatus: null,
        cars: [],
        totalSpent: 0,
        isDeleted: false,
        _carKeys: new Set<string>(),
      };
      byPhone.set(phone, user);
    }

    user.ordersCount += 1;

    if (typeof order.price === 'number' && !Number.isNaN(order.price)) {
      user.totalSpent += order.price;
    }

    if (order.user_deleted === true) {
      user.isDeleted = true;
    }

    const created = order.created_at ?? null;
    if (created) {
      const t = timeOf(created);
      if (!Number.isNaN(t)) {
        if (user.registeredAt === null || t < timeOf(user.registeredAt)) {
          user.registeredAt = created;
        }
        if (user.lastOrderAt === null || t > timeOf(user.lastOrderAt)) {
          user.lastOrderAt = created;
          user.lastStatus = order.status ?? null;
        }
      }
    }

    const name = (order.car_name || '').trim();
    const plate = (order.car_plate || '').trim();
    if (name || plate) {
      const key = `${name}|${plate}`;
      if (!user._carKeys.has(key)) {
        user._carKeys.add(key);
        user.cars.push({ name, plate });
      }
    }
  }

  const result = Array.from(byPhone.values()).map(({ _carKeys, ...user }) => {
    void _carKeys;
    return user;
  });

  result.sort((a, b) => {
    const ta = timeOf(a.lastOrderAt);
    const tb = timeOf(b.lastOrderAt);
    const sa = Number.isNaN(ta) ? -Infinity : ta;
    const sb = Number.isNaN(tb) ? -Infinity : tb;
    return sb - sa;
  });

  return result;
}
