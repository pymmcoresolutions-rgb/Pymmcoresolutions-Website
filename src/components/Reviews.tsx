import { useState, useEffect } from 'react';
import { collection, setDoc, getDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Trash2, Loader2, User as UserIcon, Quote } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Reviews({ minimal = false }: { minimal?: boolean }) {
  const { user, isAdmin, login, logActivity } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFetching(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setFetching(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const reviewDoc = doc(db, 'reviews', user.uid);
      const snap = await getDoc(reviewDoc);
      
      const reviewData: any = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userPhoto: user.photoURL || '',
        rating,
        comment,
        updatedAt: serverTimestamp()
      };

      if (!snap.exists()) {
        reviewData.createdAt = serverTimestamp();
      }

      await setDoc(reviewDoc, reviewData, { merge: true });
      await logActivity('review_posted', { rating });
      setComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reviews/${user.uid}`);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
    }
  };

  return (
    <section className={`${minimal ? 'py-8 bg-transparent' : 'py-24 bg-black'} relative overflow-hidden`}>
      <div className={`${minimal ? 'max-w-none' : 'max-w-7xl mx-auto px-4'} relative z-10`}>
        {!minimal && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Community Feedback</h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Hear what our users have to say about their experience with PymmCore Solutions.
            </p>
          </div>
        )}

        <div className={`grid grid-cols-1 ${minimal ? '' : 'lg:grid-cols-3'} gap-12`}>
          {/* Review Form */}
          {!minimal && (
            <div className="lg:col-span-1">
              <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 sticky top-24">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-400" /> Share Your Experience
                </h3>
                
                {user ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Your Review</label>
                      <textarea
                        required
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What do you think about our website and services?"
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-teal-500 outline-none transition-all resize-none text-sm"
                      />
                    </div>

                    <button
                      disabled={loading}
                      className="w-full py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Review'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-sm text-white/40 mb-6">Please log in to share your feedback with the community.</p>
                    <button
                      onClick={login}
                      className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all"
                    >
                      Log In to Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className={`${minimal ? '' : 'lg:col-span-2'} space-y-6`}>
            {fetching ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              </div>
            ) : reviews.length > 0 ? (
              <div className={`grid grid-cols-1 ${minimal ? 'md:grid-cols-1 overflow-x-auto pb-4' : 'md:grid-cols-2'} gap-6`}>
                <AnimatePresence mode="popLayout">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`${minimal ? 'w-full max-w-md' : ''} p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col h-full relative group hover:border-teal-500/30 transition-all`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                            {review.userPhoto ? (
                              <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-white/20" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{review.userName}</div>
                            <div className="text-[10px] text-white/20">
                              {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-sm text-white/60 leading-relaxed flex-1 italic relative pt-4">
                        <Quote className="absolute top-0 left-0 w-3 h-3 text-teal-500 opacity-40" />
                        "{review.comment}"
                      </p>

                      {(isAdmin || (user && user.uid === review.userId)) && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="absolute top-4 right-4 p-2 text-white/0 group-hover:text-red-500/40 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))
                  .slice(0, minimal ? 3 : undefined)}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
                <p className="text-white/20">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
