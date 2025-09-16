import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface DailyJournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  content: string; // Rich text HTML content
  mood?: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  marketConditions?: string;
  lessonsLearned?: string;
  goals?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const DAILY_JOURNALS_COLLECTION = 'daily-journals';

// Get user's daily journals collection
const getUserDailyJournalsCollection = (userId: string) => 
  collection(db, 'users', userId, DAILY_JOURNALS_COLLECTION);

export const dailyJournalService = {
  // Save or update a daily journal entry
  async saveJournalEntry(
    userId: string, 
    date: string, 
    content: string,
    additionalData?: Partial<Pick<DailyJournalEntry, 'mood' | 'marketConditions' | 'lessonsLearned' | 'goals'>>
  ): Promise<void> {
    try {
      const journalId = `${userId}_${date}`;
      const journalDoc = doc(getUserDailyJournalsCollection(userId), journalId);
      
      // Check if entry already exists
      const existingDoc = await getDoc(journalDoc);
      const now = Timestamp.now();
      
      const journalData: Omit<DailyJournalEntry, 'id'> = {
        userId,
        date,
        content,
        ...additionalData,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
        updatedAt: now,
      };

      await setDoc(journalDoc, journalData);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      throw error;
    }
  },

  // Get a specific daily journal entry
  async getJournalEntry(userId: string, date: string): Promise<DailyJournalEntry | null> {
    try {
      const journalId = `${userId}_${date}`;
      const journalDoc = doc(getUserDailyJournalsCollection(userId), journalId);
      const docSnap = await getDoc(journalDoc);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as DailyJournalEntry;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      throw error;
    }
  },

  // Get all journal entries for a user
  async getAllJournalEntries(userId: string): Promise<DailyJournalEntry[]> {
    try {
      const journalsCollection = getUserDailyJournalsCollection(userId);
      const q = query(journalsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DailyJournalEntry[];
    } catch (error) {
      console.error('Error getting all journal entries:', error);
      throw error;
    }
  },

  // Get journal entries for a specific date range
  async getJournalEntriesInRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyJournalEntry[]> {
    try {
      const journalsCollection = getUserDailyJournalsCollection(userId);
      const q = query(
        journalsCollection,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DailyJournalEntry[];
    } catch (error) {
      console.error('Error getting journal entries in range:', error);
      throw error;
    }
  },

  // Check if a journal entry exists for a specific date
  async hasJournalEntry(userId: string, date: string): Promise<boolean> {
    try {
      const entry = await this.getJournalEntry(userId, date);
      return entry !== null && entry.content.trim().length > 0;
    } catch (error) {
      console.error('Error checking journal entry existence:', error);
      return false;
    }
  },
};
