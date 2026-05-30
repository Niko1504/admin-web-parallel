import { describe, it, expect } from 'vitest';
import { aggregateUsers } from './users';
import type { OrderLike } from './users';

describe('aggregateUsers', () => {
  it('returns an empty list for no orders', () => {
    expect(aggregateUsers([])).toEqual([]);
    expect(aggregateUsers(undefined as unknown as OrderLike[])).toEqual([]);
  });

  it('groups multiple orders from the same phone into one user', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555111111', created_at: '2026-01-01T10:00:00+04:00', status: 'order_created', price: 50 },
      { client_phone: '+995555111111', created_at: '2026-02-01T10:00:00+04:00', status: 'car_returned', price: 70 },
    ];
    const users = aggregateUsers(orders);
    expect(users).toHaveLength(1);
    expect(users[0].phone).toBe('+995555111111');
    expect(users[0].ordersCount).toBe(2);
    expect(users[0].totalSpent).toBe(120);
  });

  it('uses the earliest order as registration and the latest for last order/status', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555222222', created_at: '2026-02-01T10:00:00+04:00', status: 'car_returned' },
      { client_phone: '+995555222222', created_at: '2026-01-01T10:00:00+04:00', status: 'order_created' },
    ];
    const [user] = aggregateUsers(orders);
    expect(user.registeredAt).toBe('2026-01-01T10:00:00+04:00');
    expect(user.lastOrderAt).toBe('2026-02-01T10:00:00+04:00');
    expect(user.lastStatus).toBe('car_returned');
  });

  it('prefers user_phone over client_phone as the grouping key', () => {
    const orders: OrderLike[] = [
      { user_phone: '+995555333333', client_phone: 'stale', created_at: '2026-01-01T10:00:00+04:00' },
    ];
    expect(aggregateUsers(orders)[0].phone).toBe('+995555333333');
  });

  it('collects distinct cars across orders', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555444444', car_name: 'BMW X5', car_plate: 'AA-111', created_at: '2026-01-01T10:00:00+04:00' },
      { client_phone: '+995555444444', car_name: 'BMW X5', car_plate: 'AA-111', created_at: '2026-01-02T10:00:00+04:00' },
      { client_phone: '+995555444444', car_name: 'Audi A6', car_plate: 'BB-222', created_at: '2026-01-03T10:00:00+04:00' },
    ];
    const [user] = aggregateUsers(orders);
    expect(user.cars).toHaveLength(2);
    expect(user.cars).toContainEqual({ name: 'BMW X5', plate: 'AA-111' });
    expect(user.cars).toContainEqual({ name: 'Audi A6', plate: 'BB-222' });
  });

  it('flags isDeleted when any order carries user_deleted=true', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555555555', created_at: '2026-01-01T10:00:00+04:00' },
      { client_phone: '+995555555555', created_at: '2026-01-02T10:00:00+04:00', user_deleted: true },
    ];
    expect(aggregateUsers(orders)[0].isDeleted).toBe(true);
  });

  it('does not flag isDeleted for active accounts', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555666666', created_at: '2026-01-01T10:00:00+04:00' },
    ];
    expect(aggregateUsers(orders)[0].isDeleted).toBe(false);
  });

  it('skips orders with no usable phone', () => {
    const orders: OrderLike[] = [
      { created_at: '2026-01-01T10:00:00+04:00' },
      { client_phone: '   ', created_at: '2026-01-01T10:00:00+04:00' },
    ];
    expect(aggregateUsers(orders)).toEqual([]);
  });

  it('sorts users by last activity, newest first', () => {
    const orders: OrderLike[] = [
      { client_phone: 'old', created_at: '2026-01-01T10:00:00+04:00' },
      { client_phone: 'old', created_at: '2026-04-01T10:00:00+04:00' },
      { client_phone: 'new', created_at: '2026-03-01T10:00:00+04:00' },
      { client_phone: 'mid', created_at: '2026-02-01T10:00:00+04:00' },
    ];
    expect(aggregateUsers(orders).map((u) => u.phone)).toEqual(['old', 'new', 'mid']);
  });

  it('only sums numeric prices', () => {
    const orders: OrderLike[] = [
      { client_phone: '+995555777777', created_at: '2026-01-01T10:00:00+04:00', price: 50 },
      { client_phone: '+995555777777', created_at: '2026-01-02T10:00:00+04:00', price: null },
      { client_phone: '+995555777777', created_at: '2026-01-03T10:00:00+04:00' },
    ];
    expect(aggregateUsers(orders)[0].totalSpent).toBe(50);
  });
});
