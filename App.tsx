import React, { useState, useEffect, useCallback } from 'react';
// ✅ نام متغیر اصلاح شد
import { istighfarData } from './data/istighfarData';
import ReadingView from './components/ReadingView';
import Dashboard from './components/Dashboard';
import { UserProgress, ReadingState } from './types';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const USER_ID_KEY = 'istighfar_user_id';
const LOCAL_STORAGE_KEY = 'istighfar_app_data_v1';
const READING_STATE_KEY = 'istighfar_reading_state';

const getTodayString = () => new Date().toISOString().split('T')[0];

// Get or create a unique user ID
const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

// Save reading state (current band position)
const saveReadingState = (index: number) => {
  const state: ReadingState = {
    currentIndex: index,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(READING_STATE_KEY, JSON.stringify(state));
};

// Load reading state
const loadReadingState = (): number => {
  try {
    const stored = localStorage.getItem(READING_STATE_KEY);
    if (stored) {
      const state: ReadingState = JSON.parse(stored);
      // Only restore if updated today to encourage fresh start, 
      // OR allow continuing if it's the same session logic (optional)
      // For now, let's allow resuming anytime within the same day
      const today = getTodayString();
      if (state.lastUpdated.startsWith(today)) {
        return state.currentIndex;
      }
    }
  } catch (e) {
    console.error("Failed to load reading state", e);
  }
  return 0;
};

// Clear reading state (after completion)
const clearReadingState = () => {
  localStorage.removeItem(READING_STATE_KEY);
};

const initialProgress: UserProgress = {
  streak: 0,
  lastCompletedDate: null,
  totalParagraphsRead: 0,
  hasFinishedToday: false,
  completedDays: [],
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress>(initialProgress);
  const [view, setView] = useState<'reading' | 'dashboard'>('reading');

  // Load from localStorage (for migration/fallback)
  const loadFromLocalStorage = (): UserProgress => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = getTodayString();
        const isDoneToday = data.lastCompletedDate === today;

        let effectiveStreak = data.streak || 0;
        if (data.lastCompletedDate) {
          const lastDate = new Date(data.lastCompletedDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 1) {
            effectiveStreak = 0;
          }
        }

        return {
          ...data,
          streak: effectiveStreak,
          hasFinishedToday: isDoneToday,
          completedDays: data.completedDays || [],
        };
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
    return initialProgress;
  };

  // Initialize user ID and restore reading state
  useEffect(() => {
    const id = getUserId();
    setUserId(id);

    // Restore reading position
    const savedIndex = loadReadingState();
    if (savedIndex > 0) {
      setCurrentIndex(savedIndex);
    }
  }, []);

  // Sync Data with Firestore
  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);

    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProgress;
            const today = getTodayString();

            let effectiveStreak = data.streak || 0;

            if (data.lastCompletedDate) {
              const lastDate = new Date(data.lastCompletedDate);
              const currentDate = new Date(today);
              const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays > 1) {
                effectiveStreak = 0;
              }
            }

            const isDoneToday = data.lastCompletedDate === today;

            setProgress({
              ...data,
              streak: effectiveStreak,
              hasFinishedToday: isDoneToday,
              completedDays: data.completedDays || [],
            });

            if (isDoneToday) {
              setView('dashboard');
              clearReadingState();
            }
            setLoading(false);
          } else {
            const localData = loadFromLocalStorage();
            let dataToSave = localData;

            await setDoc(userDocRef, {
              ...dataToSave,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error processing Firestore data:", error);
          const localData = loadFromLocalStorage();
          setProgress(localData);
          if (localData.hasFinishedToday) {
            setView('dashboard');
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
        const localData = loadFromLocalStorage();
        setProgress(localData);
        if (localData.hasFinishedToday) {
          setView('dashboard');
        }
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [userId]);

  // Save reading state whenever currentIndex changes
  useEffect(() => {
    if (currentIndex > 0 && view === 'reading') {
      saveReadingState(currentIndex);
    }
  }, [currentIndex, view]);

  const handleNext = useCallback(() => {
    // ✅ استفاده از istighfarData
    if (currentIndex < istighfarData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleComplete = async () => {
    if (!userId) return;

    const today = getTodayString();

    let newStreak = progress.streak;
    // ✅ استفاده از istighfarData
    let newTotal = progress.totalParagraphsRead + istighfarData.length;
    let newCompletedDays = [...(progress.completedDays || [])];

    if (progress.lastCompletedDate !== today) {
      if (!newCompletedDays.includes(today)) {
        newCompletedDays.push(today);
      }

      if (progress.lastCompletedDate) {
        const lastDate = new Date(progress.lastCompletedDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = progress.streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
    }

    const updatedData: UserProgress = {
      streak: newStreak,
      lastCompletedDate: today,
      totalParagraphsRead: newTotal,
      hasFinishedToday: true,
      completedDays: newCompletedDays,
    };

    setProgress(updatedData);
    setView('dashboard');
    clearReadingState();

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
      } catch (e) {
        console.warn("Failed to save to localStorage backup", e);
      }
    } catch (e) {
      console.error("Error saving progress to Firestore:", e);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
      } catch (localError) {
        console.error("Failed to save to localStorage", localError);
      }
    }
  };

  const handleResetForReview = () => {
    setCurrentIndex(0);
    setView('reading');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* ✅ رنگ‌ها هماهنگ با Tailwind Config جدید */}
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">در حال اتصال...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'reading' && (
        <motion.div
          key="reading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReadingView
            // ✅ استفاده از istighfarData
            item={istighfarData[currentIndex]}
            currentIndex={currentIndex}
            total={istighfarData.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
          />
        </motion.div>
      )}

      {view === 'dashboard' && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard
            progress={progress}
            onReset={handleResetForReview}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;