import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface IUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string | null;
  refreshToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Firestore does not accept `undefined` — strip those fields out
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class User {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string | null;
  refreshToken?: string | null;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: IUser) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.avatar = data.avatar ?? null;
    this.refreshToken = data.refreshToken ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async findOne(q: { email: string }): Promise<User | null> {
    const usersRef = collection(db, "users");
    const qSnapshot = await getDocs(query(usersRef, where("email", "==", q.email)));
    if (qSnapshot.empty) return null;
    const document = qSnapshot.docs[0];
    return new User({ id: document.id, ...document.data() } as IUser);
  }

  static async create(data: Partial<IUser>): Promise<User> {
    const id = uuidv4();
    const docRef = doc(db, "users", id);
    const now = new Date().toISOString();
    const userData = stripUndefined({ ...data, createdAt: now, updatedAt: now });
    await setDoc(docRef, userData);
    return new User({ id, ...userData } as IUser);
  }

  static async findById(id: string): Promise<User | null> {
    const docRef = doc(db, "users", id);
    const document = await getDoc(docRef);
    if (!document.exists()) return null;
    return new User({ id: document.id, ...document.data() } as IUser);
  }

  static async findByIdAndUpdate(id: string, data: Partial<IUser>): Promise<void> {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() });
  }

  async save(): Promise<void> {
    const { id, ...data } = this;
    const docRef = doc(db, "users", id);
    await setDoc(docRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() }, { merge: true });
  }
}
