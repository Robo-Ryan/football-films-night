import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!config.projectId) {
  throw new Error(
    "Missing Firebase config. Copy .env.local.example to .env.local and fill it in with your Firebase project details."
  );
}

const app = initializeApp(config);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const VIDEOS_COLLECTION = "videos";
export const BUCKET = "films";

// Firestore helpers
export async function getVideos() {
  const q = query(
    collection(db, VIDEOS_COLLECTION),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addVideo(data: {
  uploader_name: string;
  storage_path: string;
  video_url: string;
  position: number;
}) {
  return addDoc(collection(db, VIDEOS_COLLECTION), {
    ...data,
    created_at: new Date(),
  });
}

export async function deleteVideo(id: string) {
  await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
}

export async function updateVideoPosition(id: string, position: number) {
  await updateDoc(doc(db, VIDEOS_COLLECTION, id), { position });
}

// Storage helpers
export async function uploadFile(file: File, path: string) {
  const storageRef = ref(storage, `${BUCKET}/${path}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "video/mp4",
  });
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string) {
  const storageRef = ref(storage, `${BUCKET}/${path}`);
  await deleteObject(storageRef);
}
