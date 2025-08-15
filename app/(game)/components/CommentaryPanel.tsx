"use client";
import React from 'react';

type Message = { type: 'announcer' | 'user'; text: string };
type Props = { messages: Message[]; className?: string; style?: React.CSSProperties };

export default function CommentaryPanel({ messages, className, style }: Props) {
  return (
    <div style={style} className={className}>
      {messages.map((msg, i) => (
        <div key={i} style={msg.type === 'announcer' ? { background: '#f9fafb', padding: 8, borderRadius: 6, marginBottom: 6 } : { padding: 8, marginBottom: 6 }}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}


