export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function cloneMapOfDecks<T, V>(map: Map<T, V[]>): Map<T, V[]> {
  const newMap = new Map();

  // Both Object and Map has entries method although the order is different
  const iterator = map.entries();

  for (const item of iterator) {
    const [constraintType, gameConstraints] = item;
    newMap.set(constraintType, [...gameConstraints]);
  }

  return newMap;
}
