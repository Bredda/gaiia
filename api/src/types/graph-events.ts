export interface GraphEvent {
  stepId: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}
