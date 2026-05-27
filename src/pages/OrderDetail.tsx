import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus, updatePaymentStatus, approvePhotos, approvePhotosAfter, getAllCouriers, assignCourier, editOrder, adminCancelOrder } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { Toast, useToast } from '../components/Toast';
import { ORDER_STATUSES, STATUS_FLOW, ADMIN_CHANGEABLE_STATUSES, ADMIN_NEXT_STATUS } from '../constants/orderStatus';
import { useLanguage, getStatusTranslation } from '../i18n/LanguageContext';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { ArrowLeft, Phone, MapPin, Calendar, CreditCard, User, Clock, Image, CheckCircle, RefreshCw, X, Camera, UserPlus, Edit3, XCircle } from 'lucide-react';
import { formatGeorgiaTime } from '../utils/timezone';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const dateLocale = language === 'ka' ? ka : ru;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvingPhotos, setApprovingPhotos] = useState(false);
  const [approvingPhotosAfter, setApprovingPhotosAfter] = useState(false);
  
  // Toast notification
  const { toast, showToast, hideToast } = useToast();
  
  // Courier assignment
  const [couriers, setCouriers] = useState<any[]>([]);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [assigningCourier, setAssigningCourier] = useState(false);

  // Cancel order
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Edit order modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    location: '',
    scheduled_time: '',
    car_name: '',
    car_plate: '',
    price: '',
    client_phone: ''
  });
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  // Generate time slots (same as client app - every 30 minutes) - ALL IN GEORGIA TIME (UTC+4)
  const generateTimeSlots = () => {
    const slots: { label: string; value: string }[] = [];
    
    // Get current time in Georgia (UTC+4)
    const nowUtc = new Date();
    const georgiaOffset = 4 * 60; // UTC+4 in minutes
    const localOffset = nowUtc.getTimezoneOffset(); // Local offset in minutes (negative for east)
    const georgiaTime = new Date(nowUtc.getTime() + (georgiaOffset + localOffset) * 60000);
    
    const dayNames = language === 'ka' 
      ? ['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']
      : ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const monthNames = language === 'ka'
      ? ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
      : ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      // Calculate date in Georgia time
      const day = new Date(georgiaTime);
      day.setDate(day.getDate() + dayOffset);
      
      let dayLabel: string;
      if (dayOffset === 0) {
        dayLabel = language === 'ka' ? 'დღეს' : 'Сегодня';
      } else if (dayOffset === 1) {
        dayLabel = language === 'ka' ? 'ხვალ' : 'Завтра';
      } else {
        const dayName = dayNames[day.getDay()];
        const dayNum = day.getDate();
        const monthName = monthNames[day.getMonth()];
        dayLabel = `${dayName}, ${dayNum} ${monthName}`;
      }
      
      for (let hour = 9; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 20 && minute > 30) continue;
          
          // Skip past times for today (in Georgia time)
          if (dayOffset === 0) {
            const slotTime = hour + minute / 60;
            const currentGeorgiaTime = georgiaTime.getHours() + georgiaTime.getMinutes() / 60;
            if (slotTime <= currentGeorgiaTime) continue;
          }
          
          const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
          
          // Create ISO string with Georgia timezone offset (+04:00)
          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const dayNum = String(day.getDate()).padStart(2, '0');
          const hourStr = String(hour).padStart(2, '0');
          const minuteStr = String(minute).padStart(2, '0');
          
          // Format: 2026-05-01T09:00:00+04:00 (Georgia time)
          const georgiaIsoTime = `${year}-${month}-${dayNum}T${hourStr}:${minuteStr}:00+04:00`;
          
          slots.push({
            label: `${dayLabel}, ${timeStr}`,
            value: georgiaIsoTime,
          });
        }
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const fetchOrder = async (isRefresh = false) => {
    try {
      const response = await getOrder(id!);
      setOrder(response.data || null);
      if (isRefresh) {
        console.log('Auto-refresh: Order updated', response.data?.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await getAllCouriers();
      setCouriers(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchCouriers();
    
    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(() => {
      fetchOrder(true);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [id]);

  const handleMarkPaid = async () => {
    try {
      await updatePaymentStatus(id!, 'paid');
      fetchOrder();
      showToast(t.toast_paymentConfirmed, 'success');
    } catch (e) {
      showToast(t.toast_errorPayment, 'error');
    }
  };

  const handleAssignCourier = async (courierId: string) => {
    setAssigningCourier(true);
    try {
      await assignCourier(id!, courierId);
      fetchOrder();
      setShowCourierModal(false);
      showToast(t.toast_courierAssigned, 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || t.toast_errorAssigning, 'error');
    } finally {
      setAssigningCourier(false);
    }
  };

  const handleApprovePhotos = async () => {
    setApprovingPhotos(true);
    try {
      await approvePhotos(id!);
      fetchOrder();
      showToast(t.toast_photoBeforeApproved, 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || t.toast_errorPhotos, 'error');
    } finally {
      setApprovingPhotos(false);
    }
  };

  const handleApprovePhotosAfter = async () => {
    setApprovingPhotosAfter(true);
    try {
      await approvePhotosAfter(id!);
      fetchOrder();
      showToast(t.toast_photoAfterApproved, 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || t.toast_errorPhotos, 'error');
    } finally {
      setApprovingPhotosAfter(false);
    }
  };

  // Open edit modal with current order data
  const openEditModal = () => {
    if (order) {
      setEditForm({
        location: order.location || '',
        scheduled_time: order.scheduled_time || '',
        car_name: order.car_name || '',
        car_plate: order.car_plate || '',
        price: order.price?.toString() || '',
        client_phone: order.client_phone || ''
      });
      setShowEditModal(true);
    }
  };

  // Save edited order data
  const handleSaveEdit = async () => {
    setEditLoading(true);
    try {
      const updateData: any = {};
      if (editForm.location !== order.location) updateData.location = editForm.location;
      if (editForm.scheduled_time !== order.scheduled_time) updateData.scheduled_time = editForm.scheduled_time;
      if (editForm.car_name !== order.car_name) updateData.car_name = editForm.car_name;
      if (editForm.car_plate !== order.car_plate) updateData.car_plate = editForm.car_plate;
      if (editForm.price !== order.price?.toString()) updateData.price = parseFloat(editForm.price);
      if (editForm.client_phone !== order.client_phone) updateData.client_phone = editForm.client_phone;

      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false);
        return;
      }

      await editOrder(id!, updateData);
      fetchOrder();
      setShowEditModal(false);
      showToast(t.toast_orderUpdated || 'Заказ обновлен', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || t.toast_errorUpdating, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Cancel order handler
  const handleCancelOrder = async () => {
    setCancelLoading(true);
    try {
      await adminCancelOrder(id!);
      fetchOrder();
      setShowCancelModal(false);
      showToast(t.toast_orderCancelled || 'Заказ отменен', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || t.toast_errorCancelling || 'Ошибка отмены заказа', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Check if photo approval is required before status change
    // Block 1: When in 'client_approached' and photos_before not approved
    if (order?.status === 'client_approached' && !order?.photos_approved) {
      showToast(t.photoApprovalRequired || 'Требуется подтверждение фотографий', 'error');
      setShowStatusModal(false);
      return;
    }
    
    // Block 2: When in 'client_approached_after' and photos_after not approved
    if (order?.status === 'client_approached_after' && !order?.photos_after_approved) {
      showToast(t.photoApprovalRequired || 'Требуется подтверждение фотографий', 'error');
      setShowStatusModal(false);
      return;
    }

    setStatusLoading(true);
    try {
      await updateOrderStatus(id!, newStatus);
      fetchOrder();
      setShowStatusModal(false);
      showToast(t.toast_statusChanged, 'success');
    } catch (e: any) {
      // Extract error message from backend response
      const errorMessage = e.response?.data?.message || e.response?.data?.detail || t.toast_errorStatus;
      showToast(errorMessage, 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t.orderNotFound}</p>
        <button onClick={() => navigate('/orders')} className="mt-4 text-blue-500 hover:underline">
          {t.returnToOrders}
        </button>
      </div>
    );
  }

  const statusLabel = getStatusTranslation(order.status, t);
  const statusInfo = ORDER_STATUSES[order.status] || { label: order.status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div>
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        {t.backToOrders}
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.order} #{order.order_number || order.id.slice(-6)}</h1>
          <p className="text-gray-500 font-mono text-xs mt-1">ID: {order.id}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusLabel}
        </span>
      </div>

      {/* Status Change Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t.currentStatus}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {t.stepOf.replace('{current}', (currentStatusIndex + 1).toString()).replace('{total}', STATUS_FLOW.length.toString())}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusLabel}
            </span>
            {/* Status change button - admin can change any status */}
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={order.status === 'car_returned' || order.status === 'cancelled'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                order.status !== 'car_returned' && order.status !== 'cancelled'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {order.status !== 'car_returned' && order.status !== 'cancelled'
                ? t.changeStatus
                : t.orderFinished
              }
            </button>
            {/* Cancel order button */}
            {order.status !== 'car_returned' && order.status !== 'cancelled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t.cancelOrder || 'Отменить заказ'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.orderData}</h2>
              <button
                onClick={openEditModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {t.editOrderData}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.phone}</p>
                  <p className="font-medium text-gray-900">{order.client_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.time}</p>
                  <p className="font-medium text-gray-900">
                    {formatGeorgiaTime(order.scheduled_time, format, 'dd MMM yyyy, HH:mm', { locale: dateLocale })}
                  </p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t.address}</p>
                  <p className="font-medium text-gray-900">{order.location}</p>
                </div>
              </div>
              
              {/* Google Maps Preview */}
              {order.location_lat && order.location_lng && (
                <div className="col-span-2">
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    {/* Static Map Image */}
                    <div className="relative h-48 w-full">
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${order.location_lat},${order.location_lng}&zoom=15&size=600x200&maptype=roadmap&markers=color:red%7C${order.location_lat},${order.location_lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDwaCPQuKLGpoDPjkPJwgXwWVuk6FV9xBo'}`}
                        alt="Location map"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide map if API key is invalid
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex items-center justify-between p-3 bg-white border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        <span className="font-mono">{order.location_lat.toFixed(6)}, {order.location_lng.toFixed(6)}</span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${order.location_lat},${order.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          Google Maps
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${order.location_lat},${order.location_lng}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                          Waze
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Car Info */}
              {(order.car_name || order.car_plate) && (
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.car || 'Автомобиль'}</p>
                    <p className="font-medium text-gray-900">
                      {order.car_name}{order.car_plate ? ` (${order.car_plate})` : ''}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t.courier}</p>
                  <p className="font-medium text-gray-900">{order.courier_name || t.notAssigned}</p>
                </div>
                {/* Assign courier button - only for 'accepted' status without courier */}
                {order.status === 'accepted' && !order.courier_id && (
                  <AnimatedButton
                    onClick={() => setShowCourierModal(true)}
                    size="sm"
                    className="!px-3 !py-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t.assign}
                  </AnimatedButton>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.price}</p>
                  <p className="font-medium text-gray-900">{order.price} {t.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Media Before */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t.photosBefore} ({order.media_before?.length || 0})
              </h2>
              {/* Photo approval status */}
              {order.status === 'client_approached' && (
                <div className="flex items-center gap-2">
                  {order.photos_approved ? (
                    <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      {t.photosApproved}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4" />
                      {t.waitingForCheck}
                    </span>
                  )}
                </div>
              )}
            </div>
            {order.media_before?.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {order.media_before.map((media: any) => (
                  media.type === 'video' ? (
                    <div
                      key={media.id}
                      className="relative w-full aspect-square bg-gray-900 rounded-lg cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                      onClick={() => setSelectedImage(media.url || media.data)}
                    >
                      <video
                        src={media.url || media.data}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          // Seek to first frame for thumbnail
                          (e.target as HTMLVideoElement).currentTime = 0.1;
                        }}
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={media.id}
                      src={media.url || media.data}
                      alt="Before"
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedImage(media.url || media.data)}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Image className="w-8 h-8 mr-2" />
                {t.photosNotUploaded}
              </div>
            )}
            
            {/* Auto-check status - show when in client_approached status */}
            {order.status === 'client_approached' && (
              <div className={`mt-4 p-4 rounded-lg ${
                (order.media_before?.filter((m: any) => m.type === 'photo')?.length >= 1 && 
                 order.media_before?.filter((m: any) => m.type === 'video')?.length >= 1)
                  ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center gap-2">
                  {(order.media_before?.filter((m: any) => m.type === 'photo')?.length >= 1 && 
                    order.media_before?.filter((m: any) => m.type === 'video')?.length >= 1) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-700 font-medium">
                        {language === 'ka' ? 'მოთხოვნები დაკმაყოფილებულია' : 'Требования выполнены'} - 
                        {language === 'ka' ? 'კურიერს შეუძლია გაგრძელება' : ' курьер может продолжить'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-700">
                        {language === 'ka' ? 'საჭიროა მინიმუმ' : 'Необходимо минимум'} 1 {language === 'ka' ? 'ფოტო' : 'фото'} + 1 {language === 'ka' ? 'ვიდეო' : 'видео'}. 
                        {language === 'ka' ? 'ახლა:' : ' Сейчас:'} {order.media_before?.filter((m: any) => m.type === 'photo')?.length || 0} {language === 'ka' ? 'ფოტო' : 'фото'}, {order.media_before?.filter((m: any) => m.type === 'video')?.length || 0} {language === 'ka' ? 'ვიდეო' : 'видео'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Media After */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t.photosAfter} ({order.media_after?.length || 0})
              {order.photos_after_approved && (
                <span className="ml-2 text-sm font-normal text-green-600">✓ {t.photosApproved}</span>
              )}
            </h2>
            {order.media_after?.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {order.media_after.map((media: any) => (
                  media.type === 'video' ? (
                    <div
                      key={media.id}
                      className="relative w-full aspect-square bg-gray-900 rounded-lg cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                      onClick={() => setSelectedImage(media.url || media.data)}
                    >
                      <video
                        src={media.url || media.data}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          // Seek to first frame for thumbnail
                          (e.target as HTMLVideoElement).currentTime = 0.1;
                        }}
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={media.id}
                      src={media.url || media.data}
                      alt="After"
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedImage(media.url || media.data)}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Image className="w-8 h-8 mr-2" />
                {t.photosNotUploaded}
              </div>
            )}

            {/* Auto-check status - show when in client_approached_after status */}
            {order.status === 'client_approached_after' && (
              <div className={`mt-4 p-4 rounded-lg ${
                (order.media_after?.filter((m: any) => m.type === 'photo')?.length >= 1 && 
                 order.media_after?.filter((m: any) => m.type === 'video')?.length >= 1)
                  ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center gap-2">
                  {(order.media_after?.filter((m: any) => m.type === 'photo')?.length >= 1 && 
                    order.media_after?.filter((m: any) => m.type === 'video')?.length >= 1) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-700 font-medium">
                        {language === 'ka' ? 'მოთხოვნები დაკმაყოფილებულია' : 'Требования выполнены'} - 
                        {language === 'ka' ? 'კურიერს შეუძლია დასრულება' : ' курьер может завершить'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-700">
                        {language === 'ka' ? 'საჭიროა მინიმუმ' : 'Необходимо минимум'} 1 {language === 'ka' ? 'ფოტო' : 'фото'} + 1 {language === 'ka' ? 'ვიდეო' : 'видео'}. 
                        {language === 'ka' ? 'ახლა:' : ' Сейчас:'} {order.media_after?.filter((m: any) => m.type === 'photo')?.length || 0} {language === 'ka' ? 'ფოტო' : 'фото'}, {order.media_after?.filter((m: any) => m.type === 'video')?.length || 0} {language === 'ka' ? 'ვიდეო' : 'ვიდეო'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.payment}</h2>
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                order.payment_status === 'paid' ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                {order.payment_status === 'paid' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-500" />
                )}
                <span className={`font-medium ${
                  order.payment_status === 'paid' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {order.payment_status === 'paid' ? t.paymentPaid : t.paymentPending}
                </span>
              </div>
              {order.payment_link && (
                <a
                  href={order.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline text-sm truncate"
                >
                  {order.payment_link}
                </a>
              )}
              {order.payment_status !== 'paid' && (
                <AnimatedButton
                  onClick={handleMarkPaid}
                  variant="success"
                  fullWidth
                >
                  {t.markAsPaid}
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* Status Timeline with Timestamps */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.statusHistory}</h2>
            <div className="space-y-3">
              {STATUS_FLOW.map((status, index) => {
                const info = ORDER_STATUSES[status];
                const statusLbl = getStatusTranslation(status, t);
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                // Find timestamp from status_history
                const historyEntry = order.status_history?.find((h: any) => h.status === status);
                const timestamp = historyEntry?.timestamp;
                const changedBy = historyEntry?.changed_by;
                
                return (
                  <div key={status} className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      isCompleted ? info.dotColor : 'bg-gray-200'
                    } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${
                          isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}>
                          {statusLbl}
                        </span>
                        {timestamp && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatGeorgiaTime(timestamp, format, 'dd.MM HH:mm', { locale: dateLocale })}
                          </span>
                        )}
                      </div>
                      {timestamp && changedBy && changedBy !== 'system' && (
                        <span className="text-xs text-gray-400">
                          {changedBy === 'admin' ? t.changedBy_admin : changedBy === 'courier' ? t.changedBy_courier : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.timestamps}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.createdAt}:</span>
                <span className="text-gray-900">
                  {formatGeorgiaTime(order.created_at, format, 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.updatedAt}:</span>
                <span className="text-gray-900">
                  {formatGeorgiaTime(order.updated_at, format, 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Modal - supports both images and videos */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          {selectedImage.includes('.mp4') || selectedImage.includes('video') || selectedImage.startsWith('data:video') ? (
            <video
              src={selectedImage}
              className="max-w-[90%] max-h-[90%] object-contain"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-[90%] max-h-[90%] object-contain"
            />
          )}
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.changeStatus}</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              {STATUS_FLOW.map((status) => {
                const info = ORDER_STATUSES[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
                const statusLbl = getStatusTranslation(status, t);
                const isCurrent = status === order.status;
                return (
                  <button
                    key={status}
                    onClick={() => !isCurrent && handleStatusChange(status)}
                    disabled={statusLoading || isCurrent}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-200 cursor-default'
                        : 'hover:bg-gray-50 border-gray-100'
                    } ${statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                      {statusLbl}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {t.currentStatusLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Courier Assignment Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCourierModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.assignCourier}</h3>
              <button onClick={() => setShowCourierModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {couriers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{t.noCouriersAvailable}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {couriers.map((courier) => (
                  <button
                    key={courier.id}
                    onClick={() => handleAssignCourier(courier.id)}
                    disabled={assigningCourier}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors ${
                      assigningCourier ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{courier.name}</p>
                      <p className="text-sm text-gray-500">{courier.phone}</p>
                    </div>
                    <UserPlus className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.editOrderData}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                <input
                  type="tel"
                  value={editForm.client_phone}
                  onChange={(e) => setEditForm({...editForm, client_phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Scheduled Time - Slot selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.time}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTimeSlots(!showTimeSlots)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className={editForm.scheduled_time ? 'text-gray-900' : 'text-gray-400'}>
                      {editForm.scheduled_time 
                        ? formatGeorgiaTime(editForm.scheduled_time, format, 'dd MMM yyyy, HH:mm', { locale: dateLocale })
                        : (language === 'ka' ? 'აირჩიეთ დრო' : 'Выберите время')
                      }
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {showTimeSlots && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            setEditForm({...editForm, scheduled_time: slot.value});
                            setShowTimeSlots(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 ${
                            editForm.scheduled_time === slot.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.price}</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Car Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.car || 'Автомобиль'}</label>
                <input
                  type="text"
                  value={editForm.car_name}
                  onChange={(e) => setEditForm({...editForm, car_name: e.target.value})}
                  placeholder="Марка и модель"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Car Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.carPlate}</label>
                <input
                  type="text"
                  value={editForm.car_plate}
                  onChange={(e) => setEditForm({...editForm, car_plate: e.target.value})}
                  placeholder="AA-123-BB"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {editLoading ? '...' : t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t.cancelOrderTitle || 'Отменить заказ?'}</h3>
                <p className="text-sm text-gray-500">{t.cancelOrderDescription || 'Это действие нельзя отменить'}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              {t.cancelOrderConfirmation || 'Вы уверены, что хотите отменить заказ?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t.no || 'Нет'}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {cancelLoading ? '...' : (t.yesCancelOrder || 'Да, отменить')}
              </button>
            </div>
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
