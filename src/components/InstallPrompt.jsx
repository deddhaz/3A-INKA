import React, { useState, useEffect } from 'react';
import { School } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] bg-white p-4 rounded-2xl shadow-2xl border-2 border-orange-200 flex items-center justify-between animate-bounce">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
          <School size={20} />
        </div>
        <div className="text-xs font-bold text-gray-600">
          Pasang aplikasi di layar utama HP?
        </div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black"
      >
        INSTALL
      </button>
    </div>
  );
};

export default InstallPrompt;
