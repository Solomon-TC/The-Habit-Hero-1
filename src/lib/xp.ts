// XP calculation functions

/**
 * Calculate the XP required for the next level
 * @param currentLevel The user's current level
 * @returns The XP required to reach the next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

/**
 * Calculate the progress percentage towards the next level
 * @param totalXP The user's total XP
 * @param currentLevel The user's current level
 * @returns The percentage progress towards the next level (0-100)
 */
export function calculateLevelProgress(
  totalXP: number,
  currentLevel: number,
): number {
  // Calculate total XP required to reach the current level
  let totalXPForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXPForCurrentLevel += Math.floor(100 * Math.pow(1.5, i - 1));
  }

  // Calculate XP in the current level
  const xpInCurrentLevel = totalXP - totalXPForCurrentLevel;

  // Calculate XP needed for next level
  const xpForNextLevel = getXPForNextLevel(currentLevel);

  // Calculate progress percentage
  return Math.min(100, Math.floor((xpInCurrentLevel / xpForNextLevel) * 100));
}

/**
 * Calculate the total XP required to reach a specific level
 * @param targetLevel The target level
 * @returns The total XP required to reach the target level
 */
export function getTotalXPForLevel(targetLevel: number): number {
  let totalXP = 0;
  for (let i = 1; i < targetLevel; i++) {
    totalXP += getXPForNextLevel(i);
  }
  return totalXP;
}

/**
 * Calculate the level based on total XP
 * @param totalXP The user's total XP
 * @returns The user's level based on their XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpRequired = 0;

  while (true) {
    xpRequired += getXPForNextLevel(level);
    if (totalXP < xpRequired) {
      break;
    }
    level++;
  }

  return level;
}

/**
 * Award XP to a user
 * @param userId The user's ID
 * @param amount The amount of XP to award
 * @param reason The reason for awarding XP
 * @param sourceId Optional source ID for the XP award
 * @returns An object containing the updated user data
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  sourceId?: string,
) {
  // This would typically interact with your database
  // For now, we'll return a mock response
  return {
    success: true,
    updatedUser: {
      id: userId,
      xp: 0, // This would be the updated XP
      level: 1, // This would be the updated level
    },
    xpAwarded: amount,
    reason,
    sourceId,
    newXP: 0,
    newLevel: 1,
    oldLevel: 1,
    leveledUp: false,
  };
}
