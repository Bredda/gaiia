const arrayReducer = <T>(left: T[], right: T[]) => left.concat([...right]);
const defaultArray = <T>() => [] as T[];

export const arrayStateReducer = {
  reducer: arrayReducer,
  default: defaultArray,
};
