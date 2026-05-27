/**
 * Timezone utilities for consistent time display
 * All times should be displayed in Georgia timezone (UTC+4)
 */

// Georgia timezone offset in minutes (+4 hours = +240 minutes)
const GEORGIA_OFFSET_MINUTES = 4 * 60;

/**
 * Parse a date string and return a Date object
 */
export function parseGeorgiaTime(dateString: string | Date | undefined | null): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Format a date for display, ensuring it shows Georgia time
 * regardless of the user's local timezone
 */
export function formatGeorgiaTime(
  dateString: string | Date | undefined | null, 
  formatFn: (date: Date, format: string, options?: any) => string, 
  formatStr: string, 
  options?: any
): string {
  if (!dateString) return '';
  
  // If it's a string with +04:00, parse it directly as Georgia time
  // and display without additional conversion
  if (typeof dateString === 'string' && dateString.includes('+04:00')) {
    // Extract the local time part (before the timezone)
    const localPart = dateString.replace('+04:00', '').replace('T', ' ');
    // Create a date treating the time as-is (ignore timezone for display)
    const parts = localPart.split(/[-: ]/);
    if (parts.length >= 5) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // months are 0-indexed
      const day = parseInt(parts[2]);
      const hours = parseInt(parts[3]);
      const minutes = parseInt(parts[4]);
      const displayDate = new Date(year, month, day, hours, minutes);
      return formatFn(displayDate, formatStr, options);
    }
  }
  
  const date = parseGeorgiaTime(dateString);
  if (!date) return '';
  
  // Get user's timezone offset in minutes
  const userOffset = date.getTimezoneOffset(); // negative for east of UTC
  
  // Georgia is UTC+4, so offset from UTC is -240
  const georgiaOffsetFromUTC = -GEORGIA_OFFSET_MINUTES;
  
  // Adjust the date to show Georgia time in user's locale
  const adjustedDate = new Date(date.getTime() + (userOffset - georgiaOffsetFromUTC) * 60 * 1000);
  
  return formatFn(adjustedDate, formatStr, options);
}

/**
 * Simple formatter that returns Georgia time as a readable string
 */
export function toGeorgiaTimeString(dateString: string | Date | undefined | null): string {
  const date = parseGeorgiaTime(dateString);
  if (!date) return '';
  
  const userOffset = date.getTimezoneOffset();
  const georgiaOffsetFromUTC = -GEORGIA_OFFSET_MINUTES;
  const adjustedDate = new Date(date.getTime() + (userOffset - georgiaOffsetFromUTC) * 60 * 1000);
  
  const day = adjustedDate.getDate().toString().padStart(2, '0');
  const month = adjustedDate.toLocaleString('ru', { month: 'short' });
  const hours = adjustedDate.getHours().toString().padStart(2, '0');
  const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month}, ${hours}:${minutes}`;
}
