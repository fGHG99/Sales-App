import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

const DatePicker = ({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabled = false,
}) => {
  // Format date for input value (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Handle date change
  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      const selectedDate = new Date(value);
      onDateChange(selectedDate);
    } else {
      onDateChange(null);
    }
  };

  // Set min and max dates (allow from 1900 to current date)
  const currentDate = new Date().toISOString().split("T")[0];
  const minDate = "1900-01-01";

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
      </div>
      <input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleChange}
        min={minDate}
        max={currentDate}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md",
          "text-sm font-normal text-gray-900 placeholder-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "hover:border-gray-400 transition-colors",
          "bg-white",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50",
          className
        )}
      />
    </div>
  );
};

export default DatePicker;
