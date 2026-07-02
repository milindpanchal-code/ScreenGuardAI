import { localStorageAdapter } from "../../platform/storage/local-storage";
import { sanitizeCalibrationProfile, type CalibrationProfile } from "./calibration-schema";

export const CALIBRATION_STORAGE_KEY = "screenguard.calibration";

export async function getCalibrationProfile(): Promise<CalibrationProfile | null> {
  const storedProfile = await localStorageAdapter.get<unknown>(CALIBRATION_STORAGE_KEY, null);
  return sanitizeCalibrationProfile(storedProfile);
}

export async function saveCalibrationProfile(profile: CalibrationProfile): Promise<void> {
  const sanitizedProfile = sanitizeCalibrationProfile(profile);
  if (!sanitizedProfile) {
    throw new Error("Invalid calibration profile.");
  }

  await localStorageAdapter.set(CALIBRATION_STORAGE_KEY, sanitizedProfile);
}
