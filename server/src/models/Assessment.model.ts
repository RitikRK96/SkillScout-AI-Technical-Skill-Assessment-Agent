import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { AssessmentSession } from "@shared/types";
import { v4 as uuidv4 } from "uuid";

export type IAssessment = Omit<AssessmentSession, "_id"> & { _id: string };

export class Assessment {
  [key: string]: any;

  constructor(data: any) {
    Object.assign(this, data);
    if (!this._id && this.id) {
      this._id = this.id;
    }
  }

  static find(q: { userId: string | any }) {
    return {
      sort: async (opts: any) => {
        const assessmentsRef = collection(db, "assessments");
        const qSnapshot = await getDocs(query(assessmentsRef, where("userId", "==", q.userId)));
        let docs = qSnapshot.docs.map(document => new Assessment({ _id: document.id, ...document.data() }));
        if (opts.createdAt === -1) {
          docs.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
        return docs;
      }
    };
  }

  static async create(data: any): Promise<Assessment> {
    const id = uuidv4();
    const docRef = doc(db, "assessments", id);
    const now = new Date().toISOString();
    const assessmentData = deepStripUndefined({ ...data, createdAt: now, updatedAt: now });
    await setDoc(docRef, assessmentData);
    return new Assessment({ _id: id, ...assessmentData });
  }

  static async findOne(q: { _id?: any; userId?: any; [key: string]: any }): Promise<Assessment | null> {
    if (q._id) {
      const docRef = doc(db, "assessments", q._id);
      const document = await getDoc(docRef);
      if (!document.exists()) return null;
      const data = document.data() as any;
      if (q.userId && data.userId !== q.userId) return null;
      return new Assessment({ _id: document.id, ...data });
    }
    return null;
  }

  static async findOneAndDelete(q: { _id?: any; userId?: any; [key: string]: any }): Promise<Assessment | null> {
    const assessment = await this.findOne(q);
    if (assessment) {
      const docRef = doc(db, "assessments", q._id);
      await deleteDoc(docRef);
      return assessment;
    }
    return null;
  }

  static async findOneAndUpdate(q: { _id?: any; userId?: any; [key: string]: any }, update: any, options?: any): Promise<Assessment | null> {
    const assessment = await this.findOne(q);
    if (assessment) {
      const docRef = doc(db, "assessments", q._id);
      const now = new Date().toISOString();
      const updateData = deepStripUndefined({ ...update, updatedAt: now });
      await setDoc(docRef, updateData, { merge: true });
      if (options?.new) {
        return this.findOne(q);
      }
      return assessment;
    }
    return null;
  }

  async save(): Promise<void> {
    const { _id, id, ...data } = this;
    (data as any).updatedAt = new Date().toISOString();
    const docRef = doc(db, "assessments", _id || id);
    // Firestore rejects undefined values — strip them recursively
    const cleanData = deepStripUndefined(data);
    await setDoc(docRef, cleanData, { merge: true });
  }
}

// Recursively remove undefined values from objects/arrays for Firestore compatibility
function deepStripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(deepStripUndefined);
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = deepStripUndefined(value);
      }
    }
    return result;
  }
  return obj;
}

