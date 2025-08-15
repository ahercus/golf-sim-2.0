"use client";
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectTrigger = ({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) => (
  <SelectPrimitive.Trigger className={cn('inline-flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 min-w-[160px] text-sm', className)} {...props}>
    <SelectPrimitive.Value />
    <ChevronDown size={16} className="ml-2 opacity-70" />
  </SelectPrimitive.Trigger>
);
export const SelectContent = ({ className, ...props }: SelectPrimitive.SelectContentProps) => (
  <SelectPrimitive.Content className={cn('bg-white border border-gray-200 rounded-md shadow-lg p-1 z-[100000]', className)} {...props}>
    <SelectPrimitive.Viewport />
  </SelectPrimitive.Content>
);
export const SelectItem = ({ className, ...props }: SelectPrimitive.SelectItemProps) => (
  <SelectPrimitive.Item className={cn('px-3 py-2 rounded-md text-sm hover:bg-gray-100 cursor-pointer', className)} {...props} />
);
export const SelectValue = SelectPrimitive.Value;


