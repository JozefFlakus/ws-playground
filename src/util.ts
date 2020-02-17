export const insertIf = <T>(condition: boolean) => (...elements: T[]) =>
  condition ? elements : [];
