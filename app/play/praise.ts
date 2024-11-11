function choice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function praiseMessage(score: number): string {
  if (score >= 80) {
    return choice(["Fantastic!", "Amazing!", "Excellent!"]);
  } else if (score >= 60) {
    return choice(["Nice job!", "Great!", "Cool!"]);
  } else {
    return choice(["Good effort!", "Keep trying!", "Better luck next time!"]);
  }
}
