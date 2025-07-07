
import { setLoading, setScreenBlur } from "../store/slices/appSlice";
import type { AppDispatch } from "../store/store";

export async function runWithLoading(
  fn: () => Promise<void>,
  dispatch: AppDispatch,
  finallyCallback?: () => void
): Promise<void> {
  dispatch(setLoading(true));
  try {
    await fn();
  } finally {
    finallyCallback && finallyCallback()
    dispatch(setLoading(false));
  }
}
