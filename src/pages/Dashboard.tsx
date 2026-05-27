import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, getAllCouriers } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { ORDER_STATUSES, sortOrdersByStatusPriority } from '../constants/orderStatus';
import { useLanguage, getStatusTranslation } from '../i18n/LanguageContext';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { ClipboardList, Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ka' ? ka : ru;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        getAllOrders(),
        getAllCouriers(),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setCouriers(Array.isArray(couriersRes.data) ? couriersRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const newOrders = orders.filter(o => o.status === 'order_created');
  const activeOrders = orders.filter(o => !['order_created', 'car_returned'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'car_returned');

  const stats = [
    { label: t.newOrdersCount, value: newOrders.length, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: t.inProgressCount, value: activeOrders.length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: t.completedCount, value: completedOrders.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { label: t.couriersCount, value: couriers.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboardTitle}</h1>
          <p className="text-gray-500">{t.dashboardSubtitle}</p>
        </div>
        <AnimatedButton
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="!px-4 !py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </AnimatedButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.recentOrders}</h2>
          <Link to="/orders" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            {t.allOrders} →
          </Link>
        </div>
        {/* Table with fixed columns */}
        <table className="w-full">
          <thead className="sr-only">
            <tr>
              <th>{t.orders}</th>
              <th>{t.scheduledTime}</th>
              <th>{t.currentStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortOrdersByStatusPriority(orders).slice(0, 5).map((order) => {
              const statusLabel = getStatusTranslation(order.status, t);
              const statusInfo = ORDER_STATUSES[order.status] || { label: order.status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <Link to={`/orders/${order.id}`} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">#{order.order_number || order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.location}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <Link to={`/orders/${order.id}`}>
                      <p className="text-sm text-gray-900">
                        {format(new Date(order.scheduled_time), 'dd MMM, HH:mm', { locale: dateLocale })}
                      </p>
                      <p className="text-sm text-gray-500">{order.client_phone}</p>
                    </Link>
                  </td>
                  <td className="p-4 w-[180px]">
                    <Link to={`/orders/${order.id}`} className="flex justify-end">
                      <span 
                        className={`inline-block w-[160px] px-3 py-1 rounded-full text-xs font-medium text-center truncate ${statusInfo.bgColor} ${statusInfo.color}`}
                        title={statusLabel}
                      >
                        {statusLabel}
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {t.noOrdersYet}
          </div>
        )}
      </div>
    </div>
  );
}
