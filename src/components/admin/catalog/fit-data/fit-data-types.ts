export type FitDataScope = "PRODUCT" | "VARIANT";

export type FitDataStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type FitType =
  | "RELAXED"
  | "REGULAR"
  | "FITTED"
  | "BODYCON"
  | "OVERSIZED";

export type StretchLevel =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type Silhouette =
  | "A_LINE"
  | "MERMAID"
  | "SHEATH"
  | "BALL_GOWN"
  | "EMPIRE"
  | "STRAIGHT"
  | "FIT_AND_FLARE";

export type FitData = {
  id: string;

  scope: FitDataScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  businessType: BusinessType;

  sizeLabel?: string | null;

  bustMeasurement?: number | null;
  waistMeasurement?: number | null;
  hipMeasurement?: number | null;
  shoulderMeasurement?: number | null;
  sleeveLength?: number | null;
  garmentLength?: number | null;
  inseamLength?: number | null;

  minBust?: number | null;
  maxBust?: number | null;
  minWaist?: number | null;
  maxWaist?: number | null;
  minHip?: number | null;
  maxHip?: number | null;

  fitType: FitType;
  stretchLevel: StretchLevel;
  silhouette: Silhouette;

  customLengthAllowed: boolean;
  alterationAllowed: boolean;

  fitNotes?: string | null;

  status: FitDataStatus;

  updatedAt: string;
};