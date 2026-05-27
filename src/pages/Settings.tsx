import React, { useState, useEffect } from 'react';
import { getSettings, updateServicePrice, getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../api/client';
import { AnimatedButton } from '../components/AnimatedButton';
import { useLanguage } from '../i18n/LanguageContext';
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle, Users, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';

interface Admin {
  id: string;
  username: string;
  created_at: string;
}

export default function Settings() {
  const { t, language } = useLanguage();
  
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin management state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await getSettings();
      setSettings(response.data);
      setPrice(response.data.service_price?.toString() || '50');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const response = await getAllAdmins();
      setAdmins(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const handleSavePrice = async () => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(t.enterValidPrice);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateServicePrice(priceNum);
      setSuccess(t.priceUpdated);
      fetchSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.response?.data?.detail || t.savingError);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setAdminError(t.fillAllFields || 'Заполните все поля');
      return;
    }
    if (newPassword.length < 6) {
      setAdminError(t.passwordTooShort || 'Пароль должен быть минимум 6 символов');
      return;
    }

    setAdminSaving(true);
    setAdminError('');

    try {
      await createAdmin({ username: newUsername, password: newPassword });
      setAdminSuccess(t.adminCreated || 'Администратор создан');
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      fetchAdmins();
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (e: any) {
      setAdminError(e.response?.data?.detail || t.savingError);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;
    
    const updateData: { username?: string; password?: string } = {};
    if (newUsername.trim() && newUsername !== editingAdmin.username) {
      updateData.username = newUsername;
    }
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setAdminError(t.passwordTooShort || 'Пароль должен быть минимум 6 символов');
        return;
      }
      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setShowEditModal(false);
      return;
    }

    setAdminSaving(true);
    setAdminError('');

    try {
      await updateAdmin(editingAdmin.id, updateData);
      setAdminSuccess(t.adminUpdated || 'Администратор обновлен');
      setShowEditModal(false);
      setEditingAdmin(null);
      setNewUsername('');
      setNewPassword('');
      fetchAdmins();
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (e: any) {
      setAdminError(e.response?.data?.detail || t.savingError);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(t.confirmDeleteAdmin || `Удалить администратора ${admin.username}?`)) {
      return;
    }

    try {
      await deleteAdmin(admin.id);
      setAdminSuccess(t.adminDeleted || 'Администратор удален');
      fetchAdmins();
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (e: any) {
      setAdminError(e.response?.data?.detail || t.savingError);
      setTimeout(() => setAdminError(''), 3000);
    }
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setNewUsername(admin.username);
    setNewPassword('');
    setAdminError('');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.settingsTitle}</h1>
          <p className="text-gray-500">{t.settingsSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Settings Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t.servicePrice}</h2>
              <p className="text-sm text-gray-500">{t.servicePriceDesc}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.priceLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-semibold"
                  placeholder="50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  {t.currency}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            <AnimatedButton
              onClick={handleSavePrice}
              disabled={saving}
              loading={saving}
              fullWidth
            >
              <Save className="w-5 h-5" />
              {t.save}
            </AnimatedButton>
          </div>

          {settings && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {t.currentPrice}: <span className="font-semibold text-gray-900">{settings.service_price} {t.currency}</span>
              </p>
            </div>
          )}
        </div>

        {/* Admin Management Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.adminManagement || 'Администраторы'}</h2>
                <p className="text-sm text-gray-500">{t.adminManagementDesc || 'Управление аккаунтами'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewUsername('');
                setNewPassword('');
                setAdminError('');
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.addAdmin || 'Добавить'}
            </button>
          </div>

          {/* Success/Error messages */}
          {adminSuccess && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4" />
              {adminSuccess}
            </div>
          )}
          {adminError && !showAddModal && !showEditModal && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              {adminError}
            </div>
          )}

          {/* Admin List */}
          {adminsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{admin.username}</p>
                    <p className="text-xs text-gray-500">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'ru-RU') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t.edit || 'Редактировать'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t.delete || 'Удалить'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <p className="text-center text-gray-500 py-4">{t.noAdmins || 'Нет администраторов'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.addAdmin || 'Добавить администратора'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.username || 'Имя пользователя'}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.enterUsername || 'Введите имя'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password || 'Пароль'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder={t.enterPassword || 'Введите пароль'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {adminError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <AnimatedButton
                  onClick={handleAddAdmin}
                  disabled={adminSaving}
                  loading={adminSaving}
                  className="flex-1"
                >
                  {t.add}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t.editAdmin || 'Редактировать администратора'}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.username || 'Имя пользователя'}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.newPassword || 'Новый пароль'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder={t.leaveEmptyToKeep || 'Оставьте пустым, чтобы не менять'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {adminError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.cancel || 'Отмена'}
                </button>
                <AnimatedButton
                  onClick={handleEditAdmin}
                  disabled={adminSaving}
                  loading={adminSaving}
                  className="flex-1"
                >
                  {t.save || 'Сохранить'}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
