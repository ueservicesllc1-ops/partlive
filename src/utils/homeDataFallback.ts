export const withFallbackData = <T>(remoteData: T[] | null | undefined, mockData: T[]): T[] => {
  if (remoteData !== null && remoteData !== undefined) {
    return remoteData;
  }
  return mockData;
};
