import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, getAllCouriers, assignCourier, updateOrderStatus, updatePaymentLink } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { Toast, useToast } from '../components/Toast';
import { ORDER_STATUSES, STATUS_FLOW, STATUS_PRIORITY, ADMIN_CHANGEABLE_STATUSES } from '../constants/orderStatus';
import { useLanguage, getStatusTranslation } from '../i18n/LanguageContext';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { Search, Filter, RefreshCw, UserPlus, ArrowRightLeft, CreditCard, X, ExternalLink, ChevronDown } from 'lucide-react';
import { formatGeorgiaTime } from '../utils/timezone';

// Auto-refresh interval - 10 seconds
const REFRESH_INTERVAL = 10000;

export default function Orders() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ka' ? ka : ru;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'status' | 'created_at' | 'scheduled_time'>('status');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Toast notification
  const { toast, showToast, hideToast } = useToast();
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalType, setModalType] = useState<'courier' | 'status' | 'payment' | null>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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

  const handleRefresh = () => {
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
    
    // Start auto-refresh interval
    intervalRef.current = setInterval(() => {
      fetchData(false); // Don't show loading spinner on auto-refresh
    }, REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filteredOrders = [...orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.client_phone.includes(search) ||
        order.location.toLowerCase().includes(searchLower)
      );
    }
    return true;
  })].sort((a, b) => {
    if (sortMode === 'status') {
      const priorityA = STATUS_PRIORITY[a.status] ?? 999;
      const priorityB = STATUS_PRIORITY[b.status] ?? 999;
      return priorityA - priorityB;
    }
    if (sortMode === 'created_at') {
      const dateA = new Date(a.created_at ?? 0).getTime();
      const dateB = new Date(b.created_at ?? 0).getTime();
      return dateB - dateA;
    }
    // sortMode === 'scheduled_time'
    const dateA = new Date(a.scheduled_time ?? 0).getTime();
    const dateB = new Date(b.scheduled_time ?? 0).getTime();
    return dateB - dateA;
  });

  const handleAssignCourier = async (courierId: string) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await assignCourier(selectedOrder.id, courierId);
      closeModal();
      fetchData();
      showToast(t.toast_courierAssigned, 'success');
    } catch (e) {
      showToast(t.toast_errorAssigning, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(selectedOrder.id, status);
      closeModal();
      fetchData();
      showToast(t.toast_statusChanged, 'success');
    } catch (e) {
      showToast(t.toast_errorStatus, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedOrder || !paymentLink.trim()) return;
    setActionLoading(true);
    try {
      await updatePaymentLink(selectedOrder.id, paymentLink);
      closeModal();
      fetchData();
      showToast(t.toast_paymentLinkAdded, 'success');
    } catch (e) {
      showToast(t.toast_errorPaymentLink, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (order: any, type: 'courier' | 'status' | 'payment') => {
    setSelectedOrder(order);
    setModalType(type);
    if (type === 'payment') {
      setPaymentLink(order.payment_link || '');
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setPaymentLink('');
  };

  const handleSortClick = (field: 'status' | 'created_at' | 'scheduled_time') => {
    setSortMode(field);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.ordersTitle}</h1>
          <p className="text-gray-500">{t.ordersSubtitle}</p>
        </div>
        <AnimatedButton
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="!px-4 !py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </AnimatedButton>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.allStatuses}</option>
              {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                <option key={key} value={key}>{getStatusTranslation(key, t)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.client}</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.address}</th>
              <th
                className={`text-left px-6 py-4 text-sm font-medium cursor-pointer select-none transition-colors
                  ${sortMode === 'created_at'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                onClick={() => handleSortClick('created_at')}
              >
                <span className="flex items-center gap-1">
                  {t.createdAtColumn}
                  {sortMode === 'created_at' && <ChevronDown className="w-4 h-4" />}
                </span>
              </th>
              <th
                className={`text-left px-6 py-4 text-sm font-medium cursor-pointer select-none transition-colors
                  ${sortMode === 'scheduled_time'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                onClick={() => handleSortClick('scheduled_time')}
              >
                <span className="flex items-center gap-1">
                  {t.time}
                  {sortMode === 'scheduled_time' && <ChevronDown className="w-4 h-4" />}
                </span>
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.courier}</th>
              <th
                className={`text-left px-6 py-4 text-sm font-medium cursor-pointer select-none transition-colors w-[180px]
                  ${sortMode === 'status'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                onClick={() => handleSortClick('status')}
              >
                <span className="flex items-center gap-1">
                  {t.currentStatus}
                  {sortMode === 'status' && <ChevronDown className="w-4 h-4" />}
                </span>
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => {
              const statusLabel = getStatusTranslation(order.status, t);
              const statusInfo = ORDER_STATUSES[order.status] || { label: order.status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/orders/${order.id}`} className="font-mono text-blue-600 hover:underline">
                      {t.order} #{order.order_number || order.id.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{order.client_phone}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">{order.location}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatGeorgiaTime(order.created_at, format, 'dd MMM, HH:mm', { locale: dateLocale })}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatGeorgiaTime(order.scheduled_time, format, 'dd MMM, HH:mm', { locale: dateLocale })}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.courier_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 w-[180px]">
                    <span 
                      className={`inline-block w-[160px] px-3 py-1 rounded-full text-xs font-medium text-center truncate ${statusInfo.bgColor} ${statusInfo.color}`}
                      title={statusLabel}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(order, 'courier')}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={t.assignCourier}
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      {/* Status change button - always visible, disabled for courier statuses */}
                      <button
                        onClick={() => openModal(order, 'status')}
                        disabled={!ADMIN_CHANGEABLE_STATUSES.includes(order.status) || order.status === 'courier_assigned'}
                        className={`p-2 rounded-lg transition-colors ${
                          ADMIN_CHANGEABLE_STATUSES.includes(order.status) && order.status !== 'courier_assigned'
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={
                          ADMIN_CHANGEABLE_STATUSES.includes(order.status) && order.status !== 'courier_assigned'
                            ? t.changeStatus
                            : t.statusChangedByCourier
                        }
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(order, 'payment')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t.paymentLink}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/orders/${order.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t.details}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {t.noOrdersFound}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'courier' && t.assignCourier}
                {modalType === 'status' && t.changeStatus}
                {modalType === 'payment' && t.paymentLink}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {modalType === 'courier' && (
              <div className="space-y-2">
                {couriers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t.noCouriersAvailable}</p>
                ) : (
                  couriers.map((courier) => (
                    <button
                      key={courier.id}
                      onClick={() => handleAssignCourier(courier.id)}
                      disabled={actionLoading}
                      className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <p className="font-medium text-gray-900">{courier.name}</p>
                      <p className="text-sm text-gray-500">{courier.phone}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {modalType === 'status' && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {STATUS_FLOW.map((status) => {
                  const info = ORDER_STATUSES[status];
                  const statusLabel = getStatusTranslation(status, t);
                  const isActive = selectedOrder?.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={actionLoading}
                      className={`w-full p-4 text-left border rounded-lg transition-colors disabled:opacity-50 ${
                        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${info.bgColor} ${info.color}`}>
                        {statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {modalType === 'payment' && (
              <div className="space-y-4">
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <AnimatedButton
                  onClick={handleUpdatePayment}
                  disabled={actionLoading || !paymentLink.trim()}
                  loading={actionLoading}
                  fullWidth
                >
                  {t.save}
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
