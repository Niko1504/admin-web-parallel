import React, { useState, useEffect } from 'react';
import { getAllCouriers, createCourier, updateCourier, deleteCourier } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { Toast, useToast } from '../components/Toast';
import { useLanguage } from '../i18n/LanguageContext';
import { RefreshCw, Plus, Trash2, Phone, User, X, Edit2 } from 'lucide-react';

export default function Couriers() {
  const { t } = useLanguage();
  
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCourier, setNewCourier] = useState({ name: '', phone: '', password: '', whatsapp: '' });
  const [editCourier, setEditCourier] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', password: '', whatsapp: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  
  // Toast notification
  const { toast, showToast, hideToast } = useToast();

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const response = await getAllCouriers();
      setCouriers(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleAdd = async () => {
    if (!newCourier.name.trim() || !newCourier.phone.trim() || !newCourier.password.trim()) {
      setError(t.fillNamePhonePassword);
      return;
    }
    if (newCourier.password.length < 6) {
      setError(t.passwordMinLength);
      return;
    }
    setAddLoading(true);
    setError('');
    try {
      await createCourier({
        name: newCourier.name,
        phone: newCourier.phone,
        password: newCourier.password,
        whatsapp: newCourier.whatsapp || newCourier.phone,
      });
      setShowModal(false);
      setNewCourier({ name: '', phone: '', password: '', whatsapp: '' });
      fetchCouriers();
      showToast(t.toast_courierAdded, 'success');
    } catch (e: any) {
      if (e.response?.status === 400) {
        setError(t.courierExists);
      } else {
        setError(t.toast_errorAdding);
      }
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (courier: any) => {
    setEditCourier(courier);
    setEditForm({
      name: courier.name,
      phone: courier.phone,
      password: '',
      whatsapp: courier.whatsapp || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      setEditError(t.fillNamePhone);
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditError(t.passwordMinLength);
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const updateData: any = {
        name: editForm.name,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp || editForm.phone,
      };
      // Only update password if provided
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }
      await updateCourier(editCourier.id, updateData);
      setShowEditModal(false);
      setEditCourier(null);
      fetchCouriers();
      showToast(t.toast_courierUpdated, 'success');
    } catch (e: any) {
      if (e.response?.status === 400) {
        setEditError(e.response?.data?.detail || t.toast_errorUpdating);
      } else {
        setEditError(t.toast_errorUpdating);
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (courier: any) => {
    if (!confirm(t.confirmDeleteCourier.replace('{name}', courier.name))) return;
    try {
      await deleteCourier(courier.id);
      fetchCouriers();
      showToast(t.toast_courierDeleted, 'success');
    } catch (e) {
      showToast(t.toast_errorDelete, 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.couriersTitle}</h1>
          <p className="text-gray-500">{t.couriersSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <AnimatedButton
            onClick={fetchCouriers}
            variant="outline"
            size="sm"
            className="!px-4 !py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowModal(true)}
            size="sm"
            className="!px-4 !py-2"
          >
            <Plus className="w-4 h-4" />
            {t.add}
          </AnimatedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {couriers.map((courier) => (
          <div key={courier.id} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{courier.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {courier.phone}
                  </p>
                  {courier.whatsapp && courier.whatsapp !== courier.phone && (
                    <p className="text-sm text-green-500">WA: {courier.whatsapp}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(courier)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t.edit}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(courier)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-mono">{courier.id}</p>
            </div>
          </div>
        ))}
      </div>

      {couriers.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noCouriersAdded}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-blue-500 hover:underline"
          >
            {t.addFirstCourier}
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.addCourier}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.courierName}</label>
                <input
                  type="text"
                  value={newCourier.name}
                  onChange={(e) => setNewCourier({ ...newCourier, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone}</label>
                <input
                  type="tel"
                  value={newCourier.phone}
                  onChange={(e) => setNewCourier({ ...newCourier, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.phonePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.password}</label>
                <input
                  type="password"
                  value={newCourier.password}
                  onChange={(e) => setNewCourier({ ...newCourier, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.whatsappOptional}</label>
                <input
                  type="tel"
                  value={newCourier.whatsapp}
                  onChange={(e) => setNewCourier({ ...newCourier, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.whatsappHint}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <AnimatedButton
                onClick={handleAdd}
                disabled={addLoading}
                loading={addLoading}
                fullWidth
              >
                {t.add}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editCourier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.editCourier}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.courierName}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone}</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.phonePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.newPassword} <span className="text-gray-400 font-normal">({t.leaveEmptyToKeep})</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.whatsapp}</label>
                <input
                  type="tel"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t.whatsappHint}
                />
              </div>

              {editError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{editError}</div>
              )}

              <AnimatedButton
                onClick={handleEdit}
                disabled={editLoading}
                loading={editLoading}
                variant="success"
                fullWidth
              >
                {t.saveChanges}
              </AnimatedButton>
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
