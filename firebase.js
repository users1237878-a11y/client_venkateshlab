// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs 
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAI2vF22hWMbtbG8_GUpoQYJWv5CzM0_gg",
  authDomain: "library-1-topavan.firebaseapp.com",
  projectId: "library-1-topavan",
  storageBucket: "library-1-topavan.firebasestorage.app",
  messagingSenderId: "996354113084",
  appId: "1:996354113084:web:9b805bb4c766ec7aca0d39",
  measurementId: "G-MVHMTKXBED"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);

export { app, analytics, db };

/**
 * Real-time sync with onSnapshot on the 'students' collection.
 * Instantly syncs student records across apps.
 */
export function subscribeToStudents(onUpdate, onError) {
  const colRef = collection(db, "students");
  return onSnapshot(colRef, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    onUpdate(list);
  }, (error) => {
    console.error("Firestore synchronisation failed:", error);
    if (onError) onError(error);
  });
}

/**
 * Add or update a student record.
 */
export async function fbSaveStudent(student) {
  await setDoc(doc(db, "students", student.id), student);
}

/**
 * Delete a student record.
 */
export async function fbDeleteStudent(studentId) {
  await deleteDoc(doc(db, "students", studentId));
}

/**
 * Real-time sync with onSnapshot on the 'deleted_students' collection.
 */
export function subscribeToDeletedStudents(onUpdate, onError) {
  const colRef = collection(db, "deleted_students");
  return onSnapshot(colRef, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    onUpdate(list);
  }, (error) => {
    console.error("Firestore deleted_students synchronisation failed:", error);
    if (onError) onError(error);
  });
}

/**
 * Save an archived deleted student record.
 */
export async function fbSaveDeletedStudent(student) {
  await setDoc(doc(db, "deleted_students", student.id), student);
}

/**
 * One-time fetch of all students.
 */
export async function fbFetchStudents() {
  const colRef = collection(db, "students");
  const snapshot = await getDocs(colRef);
  const list = [];
  snapshot.forEach((docSnap) => {
    list.push(docSnap.data());
  });
  return list;
}
