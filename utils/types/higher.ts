export interface User {
    fid: number;
    username?: string;
    createdAt: Date;
    updatedAt: Date;
    currentStreak: number;
    workouts: Workout[];
    streak?: Streak;
    badges: Badge[];
  }
  
  export interface Workout {
    id: string;
    userId: number;
    day: number;
    completedAt: Date;
  }
  
  export interface Streak {
    id: string;
    userId: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate?: Date;
  }
  
  export interface Badge {
    id: string;
    name: string;
    userId: number;
    earnedAt: Date;
  }
  
  export interface DayInfo {
    gifUrl: string;
    number: number;
    day: string;
    workout: string;
    instructions: string;
    confirmation: string;
    shareText: string;
  }

  export interface UserWorkoutHistory {
    completedDays: number[];
  }