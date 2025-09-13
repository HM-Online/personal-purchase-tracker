'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(17, 24, 39, 0.9)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#0b1224' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0b1224' },
        },
      }}
    />
  );
}
