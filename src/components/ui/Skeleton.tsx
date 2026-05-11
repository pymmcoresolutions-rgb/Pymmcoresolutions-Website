import { motion } from 'motion/react';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent h-full w-full"
      />
    </div>
  );
}

export function AppCardSkeleton() {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-start mb-8 mt-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="w-16 h-6 rounded-lg" />
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <Skeleton className="w-24 h-3 rounded-full" />
        <Skeleton className="w-48 h-8 rounded-full" />
        <Skeleton className="w-full h-20 rounded-2xl" />
      </div>

      <div className="space-y-3 mb-6">
        <Skeleton className="w-20 h-2 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-3/4 h-3 rounded-full" />
          <Skeleton className="w-2/3 h-3 rounded-full" />
          <Skeleton className="w-1/2 h-3 rounded-full" />
        </div>
      </div>

      <div className="mt-auto space-y-6 pt-6 border-t border-white/5">
        <div className="flex gap-2">
          <Skeleton className="w-12 h-4 rounded-md" />
          <Skeleton className="w-12 h-4 rounded-md" />
          <Skeleton className="w-12 h-4 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-6">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4 rounded-full" />
          <Skeleton className="w-48 h-3 rounded-full opacity-50" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}
