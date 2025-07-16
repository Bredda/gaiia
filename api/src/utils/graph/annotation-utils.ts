export const arrayReducer = <T>(left: T[], right: T[]) =>
  left.concat([...right]);
export const defaultArray = <T>() => [] as T[];
export const arrayOptions = {
  reducer: arrayReducer,
  default: defaultArray,
};
