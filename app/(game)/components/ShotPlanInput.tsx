"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Props = {
  id?: string;
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
};

export default function ShotPlanInput({ id = 'shot-description', label = 'Think through your shot', value, placeholder = 'Describe your plan and how you intend to execute it', onChange }: Props) {
  return (
    <div style={{ margin: '15px 0' }}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}


