import React, { useState, useEffect, useRef } from 'react';
import { getAllOrders } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { useLanguage, getStatusTranslation } from '../i18n/LanguageContext';
import { aggregateUsers } from '../utils/users';
import type { AggregatedUser } from '../utils/users';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { Search, RefreshCw, Info, UserX, Car } from 'lucide-react';
import { formatGeorgiaTime } from '../utils/timezone';

// Auto-refresh interval - 30 seconds (lighter than the orders board)
const REFRESH_INTERVAL = 30000;

export default function Users() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ka' ? ka : ru;

  const [users, setUsers] = useState<AggregatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const ordersRes = await getAllOrders();
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      setUsers(aggregateUsers(orders));
      setError(false);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredUsers = users.filter((u) =>
    search ? u.phone.toLowerCase().includes(search.toLowerCase()) : true
  );

  const formatCar = (car: AggregatedUser['cars'][number]) => {
    if (car.name && car.plate) return `${car.name} (${car.plate})`;
    return car.name || car.plate;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.usersTitle}</h1>
          <p className="text-gray-500">{t.usersSubtitle}</p>
        </div>
        <AnimatedButton
          onClick={() => fetchData(true)}
          variant="outline"
          size="sm"
          className="!px-4 !py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </AnimatedButton>
      </div>

      {/* Limitation note — explicit, not faked */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">{t.usersDerivedNote}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.usersSearchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.phone}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.userRegistered}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.userCars}</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">{t.userOrdersCount}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.userLastOrder}</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">{t.userTotalSpent}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.currentStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.phone} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.phone}</td>
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {user.registeredAt
                    ? formatGeorgiaTime(user.registeredAt, format, 'dd MMM yyyy', { locale: dateLocale })
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {user.cars.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {user.cars.map((car, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-sm">
                          <Car className="w-3.5 h-3.5 text-gray-400" />
                          {formatCar(car)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-gray-900 font-medium">{user.ordersCount}</td>
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {user.lastOrderAt
                    ? formatGeorgiaTime(user.lastOrderAt, format, 'dd MMM, HH:mm', { locale: dateLocale })
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-6 py-4 text-right text-gray-900 whitespace-nowrap">
                  {user.totalSpent} {t.currency}
                </td>
                <td className="px-6 py-4">
                  {user.isDeleted ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      <UserX className="w-3.5 h-3.5" />
                      {t.userStatusDeleted}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                      {user.lastStatus ? getStatusTranslation(user.lastStatus, t) : t.userStatusActive}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && users.length === 0 && (
          <div className="p-8 flex items-center justify-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
        {!loading && error && (
          <div className="p-8 text-center text-red-500">{t.usersLoadError}</div>
        )}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">{t.noUsersFound}</div>
        )}
      </div>
    </div>
  );
}
