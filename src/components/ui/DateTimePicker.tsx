import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { inputClass } from './FormField';

interface DateTimePickerProps {
  /** "YYYY-MM-DDTHH:mm", same shape as a native datetime-local input's value — kept so callers don't need to change their state shape. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable moment. Both the calendar day AND the time-of-day on that boundary day are disabled before this — the native browser widget can only do the former, which is the whole reason this component exists. */
  min?: Date;
  placeholder?: string;
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// react-datepicker gives back a Date already carrying the browser's local
// wall-clock fields (year/month/day/hour/minute) — read those fields
// directly instead of going through toISOString(), which would convert to
// UTC and silently shift the value on any non-UTC machine.
function toLocalValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Date + time picker that can actually refuse an earlier time on the
 * boundary day, not just an earlier day — a native `<input type="datetime-local">`
 * has no way to grey out individual hours/minutes, only whole days via `min`,
 * so picking e.g. 4 AM when it's already 10 AM today silently "worked" even
 * with a min set. This uses react-datepicker's own time list instead of the
 * OS/browser-drawn one, so `filterTime` can disable exactly the slots that
 * are actually in the past. */
export default function DateTimePicker({ value, onChange, min, placeholder }: DateTimePickerProps) {
  return (
    <DatePicker
      selected={toDate(value)}
      onChange={(d: Date | null) => onChange(d ? toLocalValue(d) : '')}
      showTimeSelect
      timeIntervals={1}
      timeCaption="Time"
      dateFormat="dd-MMM-yyyy hh:mm aa"
      minDate={min}
      filterTime={(time: Date) => !min || time.getTime() >= min.getTime()}
      placeholderText={placeholder}
      className={inputClass}
      wrapperClassName="w-full"
      autoComplete="off"
    />
  );
}
