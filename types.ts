export interface IstighfarData {
  id: number;
  text: string;
  arabicText?: string; // متن عربی اصلی
}

export interface UserProgress {
  streak: number;
  lastCompletedDate: string | null; // ISO Date string YYYY-MM-DD
  totalParagraphsRead: number;
  hasFinishedToday: boolean;
  completedDays: string[]; // Array of completed dates for 40-day journey
}

export interface ReadingState {
  currentIndex: number;
  lastUpdated: string;
}
