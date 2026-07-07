
import { get, set } from 'idb-keyval';
import { Student } from '../types';

const STORAGE_KEY = 'libmaster_students';

export const saveStudents = async (students: Student[]): Promise<void> => {
  await set(STORAGE_KEY, students);
};

export const getStudents = async (): Promise<Student[]> => {
  const data = await get<Student[]>(STORAGE_KEY);
  return data || [];
};

export const exportData = async (): Promise<string> => {
  const data = await get<Student[]>(STORAGE_KEY);
  return JSON.stringify(data || [], null, 2);
};

export const importData = async (jsonString: string): Promise<void> => {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data)) {
      await set(STORAGE_KEY, data);
    } else {
      throw new Error('Invalid data format');
    }
  } catch (error) {
    throw new Error('Failed to import data: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
