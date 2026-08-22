'use client';

import React from 'react';

export default function InteractiveManualPage() {
  return (
    <div style={{ width: '100%', height: '100vh', border: 'none' }}>
      <iframe
        src="/manual_interactivo.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Manual Interactivo PartyLive"
      />
    </div>
  );
}
