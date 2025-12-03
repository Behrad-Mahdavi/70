export interface IstighfarData {
  id: number;
  text: string;
}

export interface UserProgress {
  streak: number;
  lastCompletedDate: string | null; // ISO Date string YYYY-MM-DD
  totalParagraphsRead: number;
  hasFinishedToday: boolean;
}