import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Heart } from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, query, 
  where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export default function TestimonyModal({ isOpen, onClose, friend, db, currentUser }) {
  const [testimony, setTestimony] = useState('');
  const [list, setList] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Ambil data testimoni khusus untuk teman ini
  useEffect(() => {
    if (!isOpen || !friend?.id) return;

    const q = query(
      collection(db, 'testimonies'),
      where('targetId', '==', friend.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [isOpen, friend?.id, db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testimony.trim()) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'testimonies'), {
        targetId: friend.id,
        senderName: currentUser?.displayName || 'Teman Misterius',
        text: testimony,
        createdAt: serverTimestamp()
      });
      setTestimony('');
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim testimoni");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <span className="font-bold">Testimoni untuk {friend.nickname || friend.name}</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* List Testimoni */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {list.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Heart className="mx-auto mb-2 opacity-20" size={40} />
              <p className="text-sm">Belum ada testimoni. <br/>Yuk, jadi yang pertama!</p>
            </div>
          ) : (
            list.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-purple-100">
                <p className="text-gray-700 text-sm">"{item.text}"</p>
                <p className="text-[10px] text-purple-400 font-bold mt-1">— {item.senderName}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input 
              type="text"
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder="Tulis sesuatu yang baik..."
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
            <button 
              disabled={isSending}
              className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
