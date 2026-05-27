# Orders Interactive Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable column headers to the Orders table for secondary sorting by `created_at` or `scheduled_time`, while keeping STATUS_PRIORITY as the immutable primary sort.

**Architecture:** Two-level sort replaces the existing `sortOrdersByStatusPriority` call in `filteredOrders`. React state (`sortBy`, `sortOrder`) drives the secondary comparator. Clickable `<th>` elements toggle sort direction or switch sort field.

**Tech Stack:** React (useState), TypeScript, lucide-react (ChevronDown, ChevronUp), Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `src/pages/Orders.tsx` | Add state, sort logic, clickable headers, icons |
| `src/i18n/translations/ru.ts` | Bump version: `2.1` → `2.2` |

`src/constants/orderStatus.ts` — **not modified** (STATUS_PRIORITY imported as-is).

---

### Task 1: Add sort state and sort logic to Orders.tsx

**Files:**
- Modify: `src/pages/Orders.tsx`

- [ ] **Step 1: Add `ChevronDown` and `ChevronUp` to the lucide-react import**

In `src/pages/Orders.tsx`, find line 10:
```ts
import { Search, Filter, RefreshCw, UserPlus, ArrowRightLeft, CreditCard, X, ExternalLink } from 'lucide-react';
```
Replace with:
```ts
import { Search, Filter, RefreshCw, UserPlus, ArrowRightLeft, CreditCard, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
```

- [ ] **Step 2: Add sort state after the existing `search` state (line ~24)**

Find:
```ts
  const [search, setSearch] = useState('');
```
Replace with:
```ts
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'scheduled_time' | 'none'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

- [ ] **Step 3: Add `handleSortClick` after the `closeModal` function (around line 144)**

Find:
```ts
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setPaymentLink('');
  };
```
Replace with:
```ts
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setPaymentLink('');
  };

  const handleSortClick = (field: 'created_at' | 'scheduled_time') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
```

- [ ] **Step 4: Replace `filteredOrders` with two-level inline sort**

Find:
```ts
  const filteredOrders = sortOrdersByStatusPriority(
    orders.filter(order => {
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
    })
  );
```
Replace with:
```ts
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
    // Primary: STATUS_PRIORITY (always)
    const priorityA = STATUS_PRIORITY[a.status] ?? 999;
    const priorityB = STATUS_PRIORITY[b.status] ?? 999;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Secondary: user-selected field
    if (sortBy === 'none') return 0;
    const dateA = new Date(a[sortBy] ?? 0).getTime();
    const dateB = new Date(b[sortBy] ?? 0).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
```

- [ ] **Step 5: Verify the app compiles without errors**

```bash
cd /Users/georgiacars/projects/admin-web-parallel && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add src/pages/Orders.tsx
git commit -m "feat: add sort state and two-level sort logic to Orders"
```

---

### Task 2: Add clickable headers with icons to the table

**Files:**
- Modify: `src/pages/Orders.tsx`

- [ ] **Step 1: Replace the static `Время создания` header with a clickable version**

Find:
```tsx
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.createdAtColumn}</th>
```
Replace with:
```tsx
              <th
                className={`text-left px-6 py-4 text-sm font-medium cursor-pointer select-none transition-colors
                  ${sortBy === 'created_at'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                onClick={() => handleSortClick('created_at')}
              >
                <span className="flex items-center gap-1">
                  {t.createdAtColumn}
                  {sortBy === 'created_at' && (
                    sortOrder === 'desc'
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronUp className="w-4 h-4" />
                  )}
                </span>
              </th>
```

- [ ] **Step 2: Replace the static `Время` header with a clickable version**

Find:
```tsx
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">{t.time}</th>
```
Replace with:
```tsx
              <th
                className={`text-left px-6 py-4 text-sm font-medium cursor-pointer select-none transition-colors
                  ${sortBy === 'scheduled_time'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                onClick={() => handleSortClick('scheduled_time')}
              >
                <span className="flex items-center gap-1">
                  {t.time}
                  {sortBy === 'scheduled_time' && (
                    sortOrder === 'desc'
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronUp className="w-4 h-4" />
                  )}
                </span>
              </th>
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd /Users/georgiacars/projects/admin-web-parallel && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Orders.tsx
git commit -m "feat: add clickable sort headers with chevron icons to Orders table"
```

---

### Task 3: Bump version to 2.2 in ru.ts

**Files:**
- Modify: `src/i18n/translations/ru.ts`

- [ ] **Step 1: Update the version string**

Find:
```ts
  adminPanel: 'Админ-панель 2.1',
```
Replace with:
```ts
  adminPanel: 'Админ-панель 2.2',
```

- [ ] **Step 2: Commit**

```bash
git add src/i18n/translations/ru.ts
git commit -m "chore: bump admin panel version to 2.2"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/georgiacars/projects/admin-web-parallel && npm run dev
```

- [ ] **Step 2: Verify default state**
  - Open Orders page
  - Header title shows **Админ-панель 2.2**
  - "Время создания" column header has `▼` (ChevronDown) icon and `font-semibold text-gray-900`
  - "Время" column header shows no icon, normal style

- [ ] **Step 3: Click "Время создания" — toggle direction**
  - First click: icon should become `▲` (ChevronUp) — oldest first
  - Click again: icon returns to `▼` — newest first

- [ ] **Step 4: Click "Время" — switch field**
  - Header switches: "Время" becomes active with `▼`, "Время создания" loses icon
  - Orders re-sort by `scheduled_time DESC` within each status group

- [ ] **Step 5: Hover inactive sortable header**
  - Hovering "Время создания" (when "Время" is active) shows `bg-gray-100` highlight and `text-gray-700`

- [ ] **Step 6: Confirm STATUS_PRIORITY still rules**
  - Orders with `order_created` status always appear before `accepted`, regardless of timestamps
