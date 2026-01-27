import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { MessageCircle, X, Smile, Send } from 'lucide-react';
import { appId } from '../firebase'; // Sesuaikan path jika berbeda

const TestimonyModal = ({ isOpen, onClose, friend, db, currentUser }) => {
  const [testimonyText, setTestimonyText] = useState('');
  const [list, setList] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Path sesuai Rule 1 Firestore
  const TESTIMONI_PATH = ['artifacts', appId, 'public', 'data', 'kelas3_testimoni'];

  useEffect(() => {
    if (!isOpen || !friend) return;

    // Rule 2: Fetch all then filter in memory to avoid complex query indexes
    const collRef = collection(db, ...TESTIMONI_PATH);
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.targetId === friend.id)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setList(data);
    }, (err) => console.error("Firestore Error:", err));

    return () => unsubscribe();
  }, [isOpen, friend, db]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!testimonyText.trim() || !currentUser) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, ...TESTIMONI_PATH), {
        targetId: friend.id,
        senderName: currentUser.displayName || "Teman Kelas",
        senderUid: currentUser.uid,
        text: testimonyText,
        createdAt: serverTimestamp()
      });
      setTestimonyText('');
    } catch (err) {
      console.error("Error sending testimony:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[35px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-4 border-purple-200 font-sans">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold">
            <MessageCircle size={20} />
            <span>Pesan untuk {friend.nickname || friend.name}</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {list.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Smile size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Belum ada testimoni.<br/>Ayo tulis pesan pertamamu!</p>
            </div>
          ) : (
            list.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-purple-50">
                <p className="text-gray-700 text-sm italic leading-relaxed">"{item.text}"</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-px flex-1 bg-purple-50"></div>
                  <p className="text-[10px] text-purple-400 font-bold uppercase">— {item.senderName}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
          <input 
            type="text"
            value={testimonyText}
            onChange={(e) => setTestimonyText(e.target.value)}
            placeholder="Tulis pesan baik..."
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <button 
            disabled={isSending || !testimonyText.trim()} 
            className="bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 active:scale-95 transition disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TestimonyModal;
