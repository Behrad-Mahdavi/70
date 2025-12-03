import React, { useState, useEffect } from 'react';
import { istighfarList } from './data/istighfarData';
import ReadingView from './components/ReadingView';
import Dashboard from './components/Dashboard';
import { UserProgress } from './types';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const USER_ID_KEY = 'istighfar_user_id';
const LOCAL_STORAGE_KEY = 'istighfar_app_data_v1';

const getTodayString = () => new Date().toISOString().split('T')[0];

// Get or create a unique user ID (stored in localStorage for multi-device sync)
const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Generate a unique ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

const initialProgress: UserProgress = {
  streak: 0,
  lastCompletedDate: null,
  totalParagraphsRead: 0,
  hasFinishedToday: false,
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
        
        // Calculate streak
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
          hasFinishedToday: isDoneToday
        };
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
    return initialProgress;
  };

  // Initialize user ID
  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  // Sync Data with Firestore using user ID
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
            
            // Calculate effective streak based on dates
            let effectiveStreak = data.streak || 0;
            
            if (data.lastCompletedDate) {
              const lastDate = new Date(data.lastCompletedDate);
              const currentDate = new Date(today);
              const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              
              // If more than 1 day passed since last completion, reset streak
              if (diffDays > 1) {
                effectiveStreak = 0;
              }
            }

            const isDoneToday = data.lastCompletedDate === today;

            setProgress({
              ...data,
              streak: effectiveStreak,
              hasFinishedToday: isDoneToday
            });

            if (isDoneToday) {
              setView('dashboard');
            }
            setLoading(false);
          } else {
            // No document exists, check localStorage for migration
            const localData = loadFromLocalStorage();
            let dataToSave = localData;

            // Initialize user document in Firestore
            await setDoc(userDocRef, {
              ...dataToSave,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            // Note: The onSnapshot will fire again with the new data
          }
        } catch (error) {
          console.error("Error processing Firestore data:", error);
          // Fallback to localStorage
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
        // Fallback to localStorage
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

  const handleNext = () => {
    if (currentIndex < istighfarList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!userId) return;
    
    const today = getTodayString();
    
    // Calculate stats to save
    let newStreak = progress.streak;
    let newTotal = progress.totalParagraphsRead + istighfarList.length;

    if (progress.lastCompletedDate !== today) {
      // Calculate streak properly
      if (progress.lastCompletedDate) {
        const lastDate = new Date(progress.lastCompletedDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak = progress.streak + 1;
        } else {
          // New streak
          newStreak = 1;
        }
      } else {
        // First time
        newStreak = 1;
      }
    }

    const updatedData: UserProgress = {
      streak: newStreak,
      lastCompletedDate: today,
      totalParagraphsRead: newTotal,
      hasFinishedToday: true
    };

    // Optimistic UI update
    setProgress(updatedData);
    setView('dashboard');
    window.scrollTo(0, 0);

    // Persist to Firestore
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
      } catch (e) {
        console.warn("Failed to save to localStorage backup", e);
      }
    } catch (e) {
      console.error("Error saving progress to Firestore:", e);
      // Fallback to localStorage
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
    window.scrollTo(0, 0);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-medium">در حال اتصال...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-10">
      {view === 'reading' && (
        <ReadingView 
          item={istighfarList[currentIndex]}
          currentIndex={currentIndex}
          total={istighfarList.length}
          onNext={handleNext}
        />
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          progress={progress}
          onReset={handleResetForReview}
        />
      )}
    </div>
  );
};

export default App;