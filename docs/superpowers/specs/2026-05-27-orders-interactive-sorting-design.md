# Orders Interactive Sorting — Design Spec

**Date:** 2026-05-27  
**Version target:** 2.2  
**Files:** `src/pages/Orders.tsx`, `src/i18n/translations/ru.ts`

---

## Goal

Add user-controlled secondary sort to the Orders table while preserving STATUS_PRIORITY as the immutable primary sort level.

---

## State

```ts
sortBy: 'created_at' | 'scheduled_time' | 'none'  // default: 'created_at'
sortOrder: 'asc' | 'desc'                           // default: 'desc'
```

---

## Sort Logic

Replace `sortOrdersByStatusPriority(...)` call in `filteredOrders` with inline two-level sort:

1. **Primary (always):** `STATUS_PRIORITY[status]` ascending — lower index = higher in table
2. **Secondary (user-selected):**
   - `created_at` — by creation timestamp
   - `scheduled_time` — by scheduled delivery time
   - `none` — no secondary sort (status groups stay in natural order)

Default secondary sort: `created_at DESC` (newest first).

Toggle behavior: clicking the active column flips `asc ↔ desc`; clicking a new column sets it with `desc`.

---

## Header UI

Clickable columns: **Время создания** (`created_at`) and **Время** (`scheduled_time`).  
All other column headers remain static.

### Styling rules

| State | Classes |
|-------|---------|
| Sortable, inactive | `cursor-pointer select-none text-gray-500 hover:bg-gray-100 hover:text-gray-700` |
| Sortable, active | `cursor-pointer select-none font-semibold text-gray-900` |

### Icons (lucide-react)

| Condition | Icon |
|-----------|------|
| Active column, `desc` (newest first) | `ChevronDown` |
| Active column, `asc` (oldest first) | `ChevronUp` |
| Inactive column | none |

Icons are rendered inline next to the column label inside a `flex items-center gap-1` wrapper.

---

## Version bump

`ru.ts`: `adminPanel: 'Админ-панель 2.1'` → `'Админ-панель 2.2'`

---

## Non-changes

- `src/constants/orderStatus.ts` — untouched; `sortOrdersByStatusPriority` remains for other consumers
- Georgian translation file — version bump not required (version string only in `ru.ts`)
- Auto-refresh behavior — unchanged; sort state persists across refreshes
