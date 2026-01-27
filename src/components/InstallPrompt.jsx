import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return; 

    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-bounce-in">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border-4 border-orange-400 max-w-sm ml-auto relative">
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-xl">
            <Download className="text-orange-500 w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Install Aplikasi?</h3>
            <p className="text-gray-500 text-sm leading-tight mb-3">
              Pasang aplikasi <b>Biodata 6C</b> agar lebih mudah dibuka!
            </p>
            
            {isIOS ? (
              <div className="bg-gray-100 p-2 rounded-lg text-xs text-gray-600 space-y-1">
                <p className="flex items-center gap-1">1. Klik tombol Share <Share size={12} className="inline" /></p>
                <p className="flex items-center gap-1">2. Pilih "Add to Home Screen" <PlusSquare size={12} className="inline" /></p>
              </div>
            ) : (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                Install Sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
