import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trash2, MessageSquare, User as UserIcon, Calendar, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import ConfirmDialog from './ConfirmDialog';

export default function ReviewsManager() {
  const { logActivity, isAdmin, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; userName: string } | null>(null);

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authLoading, isAdmin]);

  const handleDelete = async (id: string, userName: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      await logActivity('review_deleted', { id, userName });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" /> Review Moderation
        </h3>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
          {reviews.length} Total Reviews
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  {review.userPhoto ? (
                    <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white/20" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-sm">{review.userName}</h4>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 italic">"{review.comment}"</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-white/20 font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleString() : 'Just now'}
                    </span>
                    <span>UID: {review.userId.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDelete({ id: review.id, userName: review.userName })}
                  className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reviews.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
            <p className="text-white/20">No reviews to moderate.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Review"
        message={`Are you sure you want to permanently remove the review from ${confirmDelete?.userName}? This action cannot be undone.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id, confirmDelete.userName)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
