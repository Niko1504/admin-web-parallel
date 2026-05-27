// Статусы заказа (12 штук)
// Админ меняет: 1-3 (order_created, accepted, courier_assigned)
// Курьер меняет: 4-12 (остальные)

export const ORDER_STATUSES: Record<string, { label: string; color: string; bgColor: string; dotColor: string; changedBy: 'admin' | 'courier' }> = {
  // АДМИН МЕНЯЕТ (1-3)
  order_created: { label: 'Принятие заказа', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-500', changedBy: 'admin' },
  accepted: { label: 'Принят', color: 'text-blue-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500', changedBy: 'admin' },
  courier_assigned: { label: 'Курьер назначен', color: 'text-purple-600', bgColor: 'bg-purple-100', dotColor: 'bg-purple-500', changedBy: 'admin' },
  // КУРЬЕР МЕНЯЕТ (4-12)
  courier_on_way: { label: 'Выехал к клиенту', color: 'text-orange-600', bgColor: 'bg-orange-100', dotColor: 'bg-orange-500', changedBy: 'courier' },
  courier_arrived: { label: 'Курьер подъехал', color: 'text-green-600', bgColor: 'bg-green-100', dotColor: 'bg-green-500', changedBy: 'courier' },
  client_approached: { label: 'Клиент подошел', color: 'text-cyan-600', bgColor: 'bg-cyan-100', dotColor: 'bg-cyan-500', changedBy: 'courier' },
  car_taken: { label: 'Автомобиль принят', color: 'text-violet-600', bgColor: 'bg-violet-100', dotColor: 'bg-violet-500', changedBy: 'courier' },
  at_wash: { label: 'Я на мойке', color: 'text-indigo-600', bgColor: 'bg-indigo-100', dotColor: 'bg-indigo-500', changedBy: 'courier' },
  wash_completed: { label: 'Мойка завершена', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dotColor: 'bg-emerald-500', changedBy: 'courier' },
  returning_to_client: { label: 'Подъехал к клиенту', color: 'text-amber-600', bgColor: 'bg-amber-100', dotColor: 'bg-amber-600', changedBy: 'courier' },
  client_approached_after: { label: 'Клиент подошел', color: 'text-teal-600', bgColor: 'bg-teal-100', dotColor: 'bg-teal-600', changedBy: 'courier' },
  car_returned: { label: 'Автомобиль возвращен', color: 'text-green-700', bgColor: 'bg-green-200', dotColor: 'bg-green-600', changedBy: 'courier' },
};

export const STATUS_FLOW = [
  'order_created',      // 1 - Админ
  'accepted',           // 2 - Админ
  'courier_assigned',   // 3 - Админ
  'courier_on_way',     // 4 - Курьер
  'courier_arrived',    // 5 - Курьер
  'client_approached',  // 6 - Курьер (фото/видео)
  'car_taken',          // 7 - Курьер (требует одобрения админа)
  'at_wash',            // 8 - Курьер
  'wash_completed',     // 9 - Курьер
  'returning_to_client',// 10 - Курьер
  'client_approached_after', // 11 - Курьер
  'car_returned',       // 12 - Курьер (закрыт)
];

// Статусы, доступные админу для изменения (ВСЕ статусы)
export const ADMIN_CHANGEABLE_STATUSES = [
  'order_created',
  'accepted', 
  'courier_assigned',
  'courier_on_way',
  'courier_arrived',
  'client_approached',
  'car_taken',
  'at_wash',
  'wash_completed',
  'returning_to_client',
  'client_approached_after',
  'car_returned'
];

// Следующий статус для админа
export const ADMIN_NEXT_STATUS: Record<string, string> = {
  order_created: 'accepted',
  accepted: 'courier_assigned',
};

// Приоритет статусов для сортировки (меньше = выше приоритет)
export const STATUS_PRIORITY: Record<string, number> = STATUS_FLOW.reduce((acc, status, index) => {
  acc[status] = index;
  return acc;
}, {} as Record<string, number>);

// Функция сортировки заказов по приоритету статуса
export const sortOrdersByStatusPriority = (orders: any[]) => {
  return [...orders].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] ?? 999;
    const priorityB = STATUS_PRIORITY[b.status] ?? 999;
    
    // Сначала по приоритету статуса
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // При одинаковом статусе - по дате создания (новые сверху)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};
