import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders } from '../api/client';
import { ORDER_STATUSES } from '../constants/orderStatus';
import { useLanguage } from '../i18n/LanguageContext';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { Phone, MapPin, Calendar, Eye, CheckCircle } from 'lucide-react';

export default function CompletedOrders() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ka' ? ka : ru;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await getAllOrders();
      const ordersData = Array.isArray(response.data) ? response.data : [];
      // Filter only completed orders
      const completedOrders = ordersData.filter((order: any) => 
        order.status === 'car_returned'
      );
      // Sort by updated_at descending (newest first)
      completedOrders.sort((a: any, b: any) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setOrders(completedOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(fetchOrders, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.completedOrdersTitle}</h1>
          <p className="text-gray-500 mt-1">{t.totalOrders.replace('{count}', orders.length.toString())}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-600">{orders.length}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noCompletedOrders}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">{t.phone}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.address}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">{t.orderDate}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">{t.completedDate}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">{t.courier}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{t.price}</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">#{order.order_number || order.id.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{order.client_phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">{order.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {format(new Date(order.scheduled_time), 'dd MMM, HH:mm', { locale: dateLocale })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {format(new Date(order.updated_at), 'dd MMM, HH:mm', { locale: dateLocale })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{order.courier_name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">{order.price} {t.currency}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {t.details}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
