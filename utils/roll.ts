export function rollPrize(contains: any[], contains_rare: any[]): any {
  // 假设金色物品概率0.25%，普通物品99.75%
  const rareChance = 0.0025;
  if (Math.random() < rareChance && contains_rare.length > 0) {
    return contains_rare[Math.floor(Math.random() * contains_rare.length)];
  }
  return contains[Math.floor(Math.random() * contains.length)];
}

export function generatePrizeRow(contains: any[], contains_rare: any[], winner: any, rowLength = 50, winnerIndex = 40): any[] {
  const row = [];
  for (let i = 0; i < rowLength; i++) {
    if (i === winnerIndex) {
      row.push(winner);
    } else if (Math.random() < 0.02 && contains_rare.length > 0) {
      row.push(contains_rare[Math.floor(Math.random() * contains_rare.length)]);
    } else {
      row.push(contains[Math.floor(Math.random() * contains.length)]);
    }
  }
  return row;
}
