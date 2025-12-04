import React, { useState, useEffect, useCallback } from 'react';
import { istighfarData } from './data/istighfarData';
import ReadingView from './components/ReadingView';
import Dashboard from './components/Dashboard';
import { UserProgress, ReadingState } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://istighfar-api.liara.run/api';
const USER_ID_KEY = 'istighfar_user_id';
const LOCAL_STORAGE_KEY = 'istighfar_app_data_v1';
const READING_STATE_KEY = 'istighfar_reading_state';

// ✅ کد اصلاح شده (تاریخ محلی سیستم کاربر):
const getTodayString = () => {
  const d = new Date();
  // تنظیم اختلاف زمانی برای گرفتن تاریخ درست لوکال
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

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

  // Sync Data with Backend API
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
          const data = await response.json();

          if (data) {
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

            const newProgress = {
              ...data,
              streak: effectiveStreak,
              hasFinishedToday: isDoneToday,
              completedDays: data.completedDays || [],
            };

            setProgress(newProgress);

            if (isDoneToday) {
              setView('dashboard');
              clearReadingState();
            }
          } else {
            // New user or not found on server, try local storage or init
            const localData = loadFromLocalStorage();
            setProgress(localData);
            // Sync local data to server if it exists
            if (localData.totalParagraphsRead > 0) {
              await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localData)
              });
            }
          }
        } else {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error("Error fetching data from API:", error);
        const localData = loadFromLocalStorage();
        setProgress(localData);
        if (localData.hasFinishedToday) {
          setView('dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Save reading state whenever currentIndex changes
  useEffect(() => {
    if (currentIndex > 0 && view === 'reading') {
      saveReadingState(currentIndex);
    }
  }, [currentIndex, view]);

  const handleNext = useCallback(() => {
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

    // Optimistic update to local storage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
    } catch (e) {
      console.warn("Failed to save to localStorage backup", e);
    }

    // Save to Backend API
    try {
      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (e) {
      console.error("Error saving progress to API:", e);
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