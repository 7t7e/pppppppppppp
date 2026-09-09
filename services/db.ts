import { SampleRecord, UserProfile, AuditLog, CellMeasurement, QuantitativeResults } from '../types';
import { INITIAL_SAMPLES } from './sampleSeeds';
import {
  saveSampleToFirestore,
  deleteSampleFromFirestore,
  fetchAllSamplesFromFirestore,
  saveUserProfile,
} from './firebase';

const STORAGE_KEY = 'pantissue_ai_database_v1';
const USER_KEY = 'pantissue_ai_current_user_v1';
const SESSION_AUTH_KEY = 'pantissue_ai_session_authenticated_v1';

// Default active user (Doctor / Pathologist)
export const DEFAULT_USER: UserProfile = {
  id: 'usr-001',
  name: 'د. سارة أحمد',
  title: 'اختصاصية علم الأمراض والتشخيص النسيجي',
  role: 'pathologist',
  department: 'مختبر علم الأمراض الجزيئي',
  licenseNumber: 'MD-SA-9824',
  email: 'pathologist@pantissue.ai',
};

type Listener = (samples: SampleRecord[]) => void;
const listeners: Set<Listener> = new Set();

class DatabaseService {
  private getStorage(): SampleRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with realistic clinical seeds
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLES));
        // Also sync initial seeds to Firestore in background
        INITIAL_SAMPLES.forEach((sample) => {
          saveSampleToFirestore(sample).catch(() => {});
        });
        return INITIAL_SAMPLES;
      }
      const parsed = JSON.parse(data) as SampleRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLES));
        return INITIAL_SAMPLES;
      }
      return parsed;
    } catch (e) {
      console.error('Error reading from database storage', e);
      return INITIAL_SAMPLES;
    }
  }

  private saveStorage(samples: SampleRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving to database storage', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  private notifyListeners(): void {
    const data = this.getStorage();
    listeners.forEach((fn) => fn(data));
  }

  public getAll(): SampleRecord[] {
    return this.getStorage();
  }

  public getSamples(): SampleRecord[] {
    return this.getAll();
  }

  public async syncWithFirestore(_currentUser?: UserProfile): Promise<SampleRecord[]> {
    try {
      const remoteSamples = await fetchAllSamplesFromFirestore();

      if (remoteSamples.length > 0) {
        // Merge with local storage
        const local = this.getStorage();
        const map = new Map<string, SampleRecord>();
        local.forEach((s) => map.set(s.id, s));
        remoteSamples.forEach((s) => map.set(s.id, s));
        const merged = Array.from(map.values());
        this.saveStorage(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Firestore sync error, continuing with local storage:', err);
    }
    return this.getStorage();
  }

  public getById(id: string): SampleRecord | undefined {
    return this.getStorage().find((s) => s.id === id);
  }

  public addSample(record: SampleRecord): SampleRecord {
    const samples = this.getStorage();
    const existingIndex = samples.findIndex((s) => s.id === record.id);
    if (existingIndex >= 0) {
      samples[existingIndex] = record;
    } else {
      samples.unshift(record);
    }
    this.saveStorage(samples);

    // Sync to Firestore in background
    saveSampleToFirestore(record).catch((err) => {
      console.warn('Firestore save error:', err);
    });

    return record;
  }

  public updateSample(id: string, updates: Partial<SampleRecord>): SampleRecord | null {
    const samples = this.getStorage();
    const index = samples.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const current = samples[index];
    const updated: SampleRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    samples[index] = updated;
    this.saveStorage(samples);

    // Sync to Firestore in background
    saveSampleToFirestore(updated).catch((err) => {
      console.warn('Firestore update error:', err);
    });

    return updated;
  }

  public deleteSample(id: string): boolean {
    const samples = this.getStorage();
    const filtered = samples.filter((s) => s.id !== id);
    if (filtered.length !== samples.length) {
      this.saveStorage(filtered);
      deleteSampleFromFirestore(id).catch((err) => {
        console.warn('Firestore delete error:', err);
      });
      return true;
    }
    return false;
  }

  public clearDatabase(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  public exportDatabaseJson(): string {
    const data = this.getStorage();
    return JSON.stringify(data, null, 2);
  }

  public importDatabaseJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'الملف لا يحتوي على مصفوفة بيانات صالحة' };
      }
      this.saveStorage(parsed);
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'فشل في قراءة ملف JSON' };
    }
  }

  // Active User session management
  public getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (data) {
        const parsed = JSON.parse(data) as UserProfile;
        if (parsed && parsed.name) {
          return parsed;
        }
      }
    } catch {
      // fallback to DEFAULT_USER
    }
    return DEFAULT_USER;
  }

  public setCurrentUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
      localStorage.removeItem(SESSION_AUTH_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_AUTH_KEY, 'true');
    }
  }

  public logout(): void {
    localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
    localStorage.removeItem(SESSION_AUTH_KEY);
  }

  public saveUserProfileLocally(profile: UserProfile): void {
    this.setCurrentUser(profile);
  }

  // Helper to simulate running the PanTissue AI Analysis algorithm
  public processSampleAnalysis(sample: SampleRecord): SampleRecord {
    const totalVolume = sample.scanRun?.totalScanVolume || 12.8;
    // Derive realistic values based on input quality & sample
    const isQualityGood = sample.quality.qcStatus === 'passed';
    const snrFactor = Math.min(Math.max((sample.quality.snr || 15) / 25, 0.4), 1.0);
    
    // Functional vs Damaged vs Uncertain
    const healthyRatio = isQualityGood ? (0.55 + snrFactor * 0.15) : 0.40;
    const healthyVolume = Number((totalVolume * healthyRatio).toFixed(2));
    const remaining = totalVolume - healthyVolume;
    const damagedVolume = Number((remaining * 0.65).toFixed(2));
    const uncertainVolume = Number((remaining - damagedVolume).toFixed(2));

    // DAI Formula: (1 - Functional Volume / Total Volume) * 100%
    const daiPercent = Number(((1 - healthyVolume / totalVolume) * 100).toFixed(1));
    const healthyPercent = Number(((healthyVolume / totalVolume) * 100).toFixed(1));
    const damagedPercent = Number(((damagedVolume / totalVolume) * 100).toFixed(1));

    let daiCategory: 'low' | 'moderate' | 'high' = 'moderate';
    if (daiPercent < 25) daiCategory = 'low';
    else if (daiPercent > 50) daiCategory = 'high';

    let damageLevel: SampleRecord['quantitative'] extends infer Q ? (Q extends { damageLevel: infer D } ? D : never) : never = 'moderate';
    if (daiPercent < 20) damageLevel = 'mild';
    else if (daiPercent >= 45) damageLevel = 'severe';

    // Generate detailed measurement voxels/cells for the 3D space & table
    const measurements: CellMeasurement[] = [
      {
        id: 'C-001',
        type: 'Cell',
        volume: 124.8,
        x: 35.2,
        y: 84.1,
        z: 22.5,
        confidence: 94,
        status: 'reviewed',
        tissueClass: 'healthy',
      },
      {
        id: 'C-002',
        type: 'Cell',
        volume: 98.3,
        x: 41.7,
        y: 80.6,
        z: 28.2,
        confidence: 89,
        status: 'needs_review',
        tissueClass: 'transition',
      },
      {
        id: 'V-001',
        type: 'Vessel',
        volume: 2450.2,
        x: 120.5,
        y: 64.2,
        z: 40.8,
        confidence: 91,
        status: 'reviewed',
        tissueClass: 'healthy',
      },
      {
        id: 'C-003',
        type: 'Cell',
        volume: 142.1,
        x: 55.8,
        y: 92.4,
        z: 15.0,
        confidence: 96,
        status: 'reviewed',
        tissueClass: 'healthy',
      },
      {
        id: 'C-004',
        type: 'Cell',
        volume: 88.6,
        x: 28.3,
        y: 110.2,
        z: 32.1,
        confidence: 78,
        status: 'needs_review',
        tissueClass: 'damaged',
      },
      {
        id: 'C-005',
        type: 'Cell',
        volume: 110.5,
        x: 62.4,
        y: 75.3,
        z: 18.9,
        confidence: 92,
        status: 'reviewed',
        tissueClass: 'healthy',
      },
      {
        id: 'R-001',
        type: 'Region',
        volume: 840.0,
        x: 48.0,
        y: 95.0,
        z: 35.0,
        confidence: 85,
        status: 'needs_review',
        tissueClass: 'damaged',
      },
      {
        id: 'C-006',
        type: 'Cell',
        volume: 104.2,
        x: 77.1,
        y: 88.6,
        z: 24.3,
        confidence: 90,
        status: 'reviewed',
        tissueClass: 'transition',
      },
    ];

    const quantitative: QuantitativeResults = {
      totalVolume,
      healthyVolume,
      damagedVolume,
      transitionVolume: Number((totalVolume * 0.12).toFixed(2)),
      unclassifiedVolume: uncertainVolume,
      healthyPercent,
      damagedPercent,
      daiPercent,
      daiCategory,
      damageLevel,
      spatialPattern: daiPercent > 40 ? 'multifocal' : 'focal',
      mostAffectedCoordinate: 'X: 35.2, Y: 84.1, Z: 22.5 (القطاع العلوي الأيمن)',
      affectedFociCount: daiPercent > 30 ? 3 : 1,
      averageConfidence: 92.4,
      uncertaintyLevel: isQualityGood ? 'low' : 'moderate',
      measurements,
    };

    const auditEntry: AuditLog = {
      id: 'aud-' + Date.now(),
      sampleId: sample.id,
      action: 'اكتمال المعالجة والتحليل بالذكاء الاصطناعي (PT-AI v0.9.0)',
      actorName: 'PanTissue AI Engine',
      actorRole: 'admin',
      timestamp: new Date().toISOString(),
      details: `تم حساب مؤشر الضمور الرقمي بنجاح (${daiPercent}%) واكتشاف ${measurements.length} هياكل نسيجية.`,
    };

    const updated: SampleRecord = {
      ...sample,
      processingStatus: 'completed',
      isDraft: false,
      quantitative,
      review: {
        ...sample.review,
        reviewStatus: 'pending',
        preliminaryImpression: `يُظهر التحليل النسيجي ثلاثي الأبعاد وجود مناطق ضمور بؤري بنسبة ${daiPercent}% ضمن النسيج المفحوص، تتركز في القطاع القريب. يتطلب تقييماً سريرياً ومطابقة مع نتائج الفحص المجهري التقليدي.`,
        recommendation: 'مراجعة اختصاصي علم الأمراض واعتماد التقرير أو طلب صبغات مناعية تكميلية عند الحاجة.',
      },
      auditTrail: [auditEntry, ...(sample.auditTrail || [])],
      updatedAt: new Date().toISOString(),
    };

    this.addSample(updated);
    return updated;
  }
}

export const db = new DatabaseService();
