function choice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function praiseMessage(score: number): string {
  if (score >= 90) {
    // A
    return choice(["Fantastic!", "Amazing!", "Excellent!"]);
  } else if (score >= 70) {
    // B
    return choice(["Nice job!", "Great!", "Cool!"]);
  } else {
    // C
    return choice(["Good effort!", "Keep trying!", "Better luck next time!"]);
  }
}
