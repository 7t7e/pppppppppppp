import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import configData from '../firebase-applet-config.json';
import { SampleRecord, UserProfile } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(configData);
export const auth = getAuth(app);

// Use specified database ID if available
export const firestore = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

// Collection names
export const USERS_COLLECTION = 'users';
export const SAMPLES_COLLECTION = 'samples';

export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

// User Profile Firestore operations
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const userRef = doc(firestore, USERS_COLLECTION, profile.id);
  await setDoc(userRef, {
    ...profile,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function registerDoctorInFirebase(doctorData: {
  email: string;
  password: string;
  name: string;
  title: string;
  role?: UserProfile['role'];
  department: string;
  hospital?: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
}): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, doctorData.email, doctorData.password);
  const profile: UserProfile = {
    id: cred.user.uid,
    name: doctorData.name,
    title: doctorData.title,
    role: doctorData.role || 'pathologist',
    department: doctorData.department,
    hospital: doctorData.hospital,
    specialty: doctorData.specialty,
    licenseNumber: doctorData.licenseNumber,
    email: doctorData.email,
    phone: doctorData.phone,
    createdAt: new Date().toISOString(),
  };

  await saveUserProfile(profile);
  return profile;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}

// Samples Firestore operations
export async function saveSampleToFirestore(sample: SampleRecord): Promise<void> {
  const sampleRef = doc(firestore, SAMPLES_COLLECTION, sample.id);
  await setDoc(sampleRef, {
    ...sample,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSampleFromFirestore(sampleId: string): Promise<void> {
  const sampleRef = doc(firestore, SAMPLES_COLLECTION, sampleId);
  await deleteDoc(sampleRef);
}

export async function fetchAllSamplesFromFirestore(): Promise<SampleRecord[]> {
  try {
    const colRef = collection(firestore, SAMPLES_COLLECTION);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as SampleRecord);
  } catch (err) {
    console.error('Error fetching all samples:', err);
    return [];
  }
}

// Subscribe to real-time samples for clinical team
export function subscribeToSamples(
  _profile: UserProfile,
  onSamplesUpdated: (samples: SampleRecord[]) => void
) {
  const colRef = collection(firestore, SAMPLES_COLLECTION);

  return onSnapshot(colRef, (snapshot) => {
    const all = snapshot.docs.map((doc) => doc.data() as SampleRecord);
    onSamplesUpdated(all);
  }, (err) => {
    console.error('Firestore snapshot listener error:', err);
  });
}
