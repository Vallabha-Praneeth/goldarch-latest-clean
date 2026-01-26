'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DateRange, TimePeriod, getDateRangeFromPeriod } from '@/lib/utils/analytics';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange, period: TimePeriod) => void;
  className?: string;
}

const periodLabels: Record<TimePeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'ytd': 'Year to date',
  'all': 'All time',
  'custom': 'Custom range',
};

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [isOpen, setIsOpen] = useState(false);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const newRange = getDateRangeFromPeriod(period);
      onChange(newRange, period);
      setIsOpen(false);
    }
  };

  const handleCustomRangeChange = (range: DayPickerDateRange | undefined) => {
    if (range?.from) {
      const newRange: DateRange = {
        from: range.from,
        to: range.to || range.from,
      };
      onChange(newRange, 'custom');
      if (range.to) {
        setIsOpen(false);
      }
    }
  };

  const formatDateRange = () => {
    if (selectedPeriod === 'custom') {
      return `${value.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${value.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return periodLabels[selectedPeriod];
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={selectedPeriod} onValueChange={(val) => handlePeriodChange(val as TimePeriod)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">{periodLabels['7d']}</SelectItem>
          <SelectItem value="30d">{periodLabels['30d']}</SelectItem>
          <SelectItem value="90d">{periodLabels['90d']}</SelectItem>
          <SelectItem value="ytd">{periodLabels.ytd}</SelectItem>
          <SelectItem value="all">{periodLabels.all}</SelectItem>
          <SelectItem value="custom">{periodLabels.custom}</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === 'custom' && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: value.from,
                to: value.to,
              }}
              onSelect={handleCustomRangeChange}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
