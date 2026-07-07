import { Student } from '../types';
import { 
  db, 
  subscribeToStudents as jsSubscribeToStudents, 
  fbSaveStudent as jsFbSaveStudent, 
  fbDeleteStudent as jsFbDeleteStudent, 
  fbFetchStudents as jsFbFetchStudents,
  subscribeToDeletedStudents as jsSubscribeToDeletedStudents,
  fbSaveDeletedStudent as jsFbSaveDeletedStudent
} from '../firebase.js';

export { db };

export interface DeletedStudent {
  id: string;
  userId: string;
  n: string; // studentName
  t: number; // tableNumber
  p: {
    id: string;
    amount: number;
    date: string;
    mode: 'Cash' | 'Online';
    forMonth: string;
  }[];
  deletedAt: any; // Date or Firestore Timestamp
  expireAt: any; // Date or Firestore Timestamp (TTL)
}

export const subscribeToDeletedStudents = (
  onUpdate: (students: DeletedStudent[]) => void,
  onError?: (error: Error) => void
) => {
  return jsSubscribeToDeletedStudents(onUpdate, onError);
};

export const fbSaveDeletedStudent = async (student: DeletedStudent): Promise<void> => {
  await jsFbSaveDeletedStudent(student);
};

// Mock auth for compatibility to prevent compile errors and ease transition
export const loginWithGoogle = async (): Promise<any> => {
  return null;
};

export const logoutUser = async (): Promise<void> => {
  return;
};

export const subscribeToAuth = (callback: (user: null) => void) => {
  // Always trigger with null since we are in fully shared database mode
  callback(null);
  return () => {};
};

/**
 * Sync (listen real-time) to students globally
 */
export const subscribeToStudents = (
  onUpdate: (students: Student[]) => void,
  onError?: (error: Error) => void
) => {
  return jsSubscribeToStudents(onUpdate, onError);
};

/**
 * Add or Save a student record
 */
export const fbSaveStudent = async (student: Student, _unusedUserId?: string): Promise<void> => {
  await jsFbSaveStudent(student);
};

/**
 * Delete a student record
 */
export const fbDeleteStudent = async (studentId: string): Promise<void> => {
  await jsFbDeleteStudent(studentId);
};

/**
 * One-time fetch of all students
 */
export const fbFetchStudents = async (): Promise<Student[]> => {
  return (await jsFbFetchStudents()) as Student[];
};
