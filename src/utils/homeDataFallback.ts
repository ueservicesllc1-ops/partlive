export const withFallbackData = <T>(remoteData: T[] | null | undefined, mockData: T[]): T[] => {
  if (remoteData && remoteData.length > 0) {
    return remoteData;
  }
  return mockData;
};
