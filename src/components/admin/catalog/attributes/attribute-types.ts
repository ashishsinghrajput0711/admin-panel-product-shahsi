export type AttributeStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BackendAttributeFieldType =
  | "text"
  | "number"
  | "boolean"
  | "dropdown"
  | "multi_select"
  | "swatch"
  | "image"
  | "date"
  | "formula"
  | "linked_products"
  | string;

export type AttributeType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | "COLOR"
  | "SIZE"
  | string;

export type AttributeScope =
  | "PRODUCT"
  | "VARIANT"
  | "PRODUCT_AND_VARIANT"
  | string;

export type AttributeGroup =
  | "PRODUCT"
  | "VARIANT"
  | "FIT"
  | "STYLE"
  | "SEO"
  | "SEARCH"
  | "MTO"
  | "RENTAL"
  | "RESALE"
  | "BASIC"
  | "SIZE"
  | "COLOR"
  | "FABRIC"
  | "OCCASION"
  | "CUSTOM"
  | string;

export type AttributeOption = {
  id?: string;
  label?: string | null;
  value?: string | null;
  colorHex?: string | null;
  hexCode?: string | null;
  imageUrl?: string | null;
  position?: number | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Attribute = {
  id: string;

  name?: string | null;
  label?: string | null;
  slug?: string | null;
  code?: string | null;
  key?: string | null;

  description?: string | null;

  type?: AttributeType | string | null;
  fieldType?: BackendAttributeFieldType | string | null;

  scope?: AttributeScope | string | null;
  group?: AttributeGroup | string | null;

  isRequired?: boolean | null;
  isFilterable?: boolean | null;
  isSearchable?: boolean | null;

  isVariantLevel?: boolean | null;
  isVariantDefining?: boolean | null;
  isVariantOption?: boolean | null;

  isSeoField?: boolean | null;
  isFitEngineField?: boolean | null;
  isStyleEngineField?: boolean | null;
  isBulkUploadField?: boolean | null;

  optionsCount?: number | null;
  options?: AttributeOption[] | null;

  isActive?: boolean | null;
  status?: AttributeStatus | string | null;

  sortOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AttributeFiltersState = {
  search: string;
  status: "ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  type: "ALL" | string;
  flag:
    | "ALL"
    | "REQUIRED"
    | "FILTERABLE"
    | "SEARCHABLE"
    | "VARIANT"
    | "SEO"
    | "FIT"
    | "STYLE"
    | "BULK_UPLOAD";
};