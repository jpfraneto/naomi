import prisma from "./prismaClient";
import { User, Workout, Streak, Badge } from "./types/higher";

export async function getOrCreateUser(fid: number): Promise<User> {
    let user = await prisma.user.findUnique({ where: { fid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fid,
          streak: { create: {} },
        },
      });
    }
    return user;
  }

  export interface UserWorkoutHistory {
    completedDays: number[];
  }
  
  export async function getUserWorkoutHistory(fid: number): Promise<UserWorkoutHistory> {
    const workouts = await prisma.workout.findMany({
      where: { userId: fid },
      select: { day: true },
      orderBy: { completedAt: 'asc' },
    });
  
    return {
      completedDays: workouts.map(workout => workout.day)
    };
  }

  export async function hasUserCompletedWorkoutToday(fid: number, day: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const workout = await prisma.workout.findFirst({
      where: {
        userId: fid,
        day: day,
        completedAt: {
          gte: today,
        },
      },
    });
  
    return !!workout;
  }
  
  
  export async function updateUserWorkout(fid: number, day: number): Promise<Workout> {
    const workout = await prisma.workout.create({
      data: {
        userId: fid,
        day,
      },
    });
  
    await updateStreak(fid);
    await checkAndAwardBadges(fid);
  
    return workout;
  }
  
  export async function updateStreak(fid: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { fid },
      include: { streak: true, workouts: { orderBy: { completedAt: 'desc' }, take: 2 } },
    });
  
    if (!user || !user.streak) return;
  
    const [latestWorkout, previousWorkout] = user.workouts;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
  
    if (latestWorkout && latestWorkout.completedAt >= yesterday) {
      user.currentStreak++;
      user.streak.currentStreak = user.currentStreak;
      user.streak.longestStreak = Math.max(user.currentStreak, user.streak.longestStreak);
    } else {
      user.currentStreak = 1;
      user.streak.currentStreak = 1;
    }
  
    user.streak.lastWorkoutDate = latestWorkout?.completedAt;
  
    await prisma.user.update({
      where: { fid },
      data: {
        currentStreak: user.currentStreak,
        streak: {
          update: {
            currentStreak: user.streak.currentStreak,
            longestStreak: user.streak.longestStreak,
            lastWorkoutDate: user.streak.lastWorkoutDate,
          },
        },
      },
    });
  }
  
  async function checkAndAwardBadges(fid: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { fid },
      include: { workouts: true, badges: true, streak: true },
    });
  
    if (!user) return;
  
    const badgesToAward: { name: string }[] = [];
  
    if (user.workouts.length === 1 && !user.badges.some(b => b.name === 'First Workout')) {
      badgesToAward.push({ name: 'First Workout' });
    }
  
    if (user.currentStreak === 7 && !user.badges.some(b => b.name === '7-Day Streak')) {
      badgesToAward.push({ name: '7-Day Streak' });
    }
  
    for (const badge of badgesToAward) {
      await prisma.badge.create({
        data: {
          name: badge.name,
          userId: fid,
        },
      });
    }
  }