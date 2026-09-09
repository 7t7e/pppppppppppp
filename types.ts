export type UserRole = 
  | 'admin'          // مدير النظام
  | 'pathologist'    // اختصاصي علم الأمراض
  | 'technician'     // فني مختبر
  | 'physician'      // طبيب مُحيل
  | 'researcher';    // باحث

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  department: string;
  hospital?: string;
  specialty?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  avatar?: string;
  createdAt?: string;
}

export type PriorityLevel = 'routine' | 'stat'; // روتيني | عاجل
export type ReviewStatus = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'retest';
export type ProcessingStatus = 'draft' | 'pending_scan' | 'scanning' | 'analyzing' | 'completed' | 'failed';
export type AcceptanceStatus = 'accepted' | 'conditional' | 'rejected';
export type DamageLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type SpatialPattern = 'focal' | 'multifocal' | 'diffuse' | 'peripheral' | 'unspecified';

export interface Patient {
  patientId: string;
  mrn: string; // Medical Record Number
  fullName: string;
  birthDate: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
}

export interface CaseOrder {
  caseId: string;
  accessionNumber: string;
  orderingDepartment: string;
  orderingProvider: string;
  clinicalNote: string;
  priority: PriorityLevel;
  createdAt: string;
}

export interface PreparationQuality {
  fixativeType: string;
  fixationDuration: string; // بالدقائق أو الساعات
  prepMethod: string;
  vhhPanel: string; // VHH Nanobody marker
  labelType: string; // Fluorophore, HRP, enzymatic
  incubationMinutes: number;
  qcStatus: 'passed' | 'failed' | 'needs_repeat';
  snr: number; // Signal to Noise Ratio
  artifacts: string; // ضجيج، طيات، فقاعات، لا يوجد
  qcDecision: 'continue' | 'rescan' | 'new_sample';
}

export interface ScanRun {
  scanRunId: string;
  scannerId: string;
  scannedAt: string;
  wavelength: string;
  voxelSize: string; // µm³
  sliceCount: number;
  totalScanVolume: number; // mm³
  signalIntensityRange: string;
  preprocessingAlgorithm: string;
  segmentationModel: string;
  surfaceAlgorithm: string;
}

export interface CellMeasurement {
  id: string;
  type: 'Cell' | 'Vessel' | 'Region';
  volume: number; // mm³ or µm³
  x: number;
  y: number;
  z: number;
  confidence: number; // 0-100%
  status: 'reviewed' | 'needs_review';
  tissueClass: 'healthy' | 'damaged' | 'transition' | 'unclassified';
}

export interface QuantitativeResults {
  totalVolume: number; // mm³
  healthyVolume: number; // mm³
  damagedVolume: number; // mm³
  transitionVolume: number; // mm³
  unclassifiedVolume: number; // mm³
  healthyPercent: number;
  damagedPercent: number;
  daiPercent: number; // Digital Atrophy Index: (1 - Healthy / Total) * 100%
  daiCategory: 'low' | 'moderate' | 'high';
  damageLevel: DamageLevel;
  spatialPattern: SpatialPattern;
  mostAffectedCoordinate: string; // e.g. "X:35.2, Y:84.1, Z:22.5 (Apex)"
  affectedFociCount: number;
  averageConfidence: number;
  uncertaintyLevel: 'low' | 'moderate' | 'high';
  measurements: CellMeasurement[];
}

export interface DiagnosticReview {
  pathologistComment: string;
  preliminaryImpression: string;
  recommendation: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  digitalSignature?: string;
}

export interface AuditLog {
  id: string;
  sampleId: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  details?: string;
}

export interface SampleRecord {
  id: string; // Sample ID e.g. "SMP-2026-001"
  caseId: string;
  accessionNumber: string;
  barcode: string;
  patient: Patient;
  order: CaseOrder;
  specimenType: string;
  anatomicalSite: string;
  anatomicalSide: 'right' | 'left' | 'not_applicable';
  containerBlockId: string;
  collectionAt: string;
  receivedAt: string;
  acceptanceStatus: AcceptanceStatus;
  processingStatus: ProcessingStatus;
  quality: PreparationQuality;
  scanRun?: ScanRun;
  quantitative?: QuantitativeResults;
  review: DiagnosticReview;
  auditTrail: AuditLog[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  department: string;
  specimenType: string;
  processingStatus: string;
  reviewStatus: string;
  damageLevel: string;
  priority: string;
  daiMin?: number;
  daiMax?: number;
}
