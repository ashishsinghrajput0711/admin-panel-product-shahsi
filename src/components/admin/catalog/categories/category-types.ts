export type CategoryFaq = {
  question: string;
  answer: string;
};

export type CategoryMetafields = {
  topMenu?: string;
  fromBlog?: string;
  subHeading?: string;
  primaryCollection?: string;
  secondaryCollection?: string;
  [key: string]: string | undefined;
};

export type CategoryNode = {
  id: string;
  nodeType?: string;
  type?: string;
  deleteId?: string;
  deleteSlug?: string;
  deleteType?: string;

  name: string;
  slug: string;
  parentId?: string | null;
  parentSlug?: string | null;
  collectionSlug?: string | null;

  description?: string | null;
  imageUrl?: string | null;
  imageName?: string | null;
  imageAltText?: string | null;
  themeTemplate?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSlug?: string | null;

  metafields?: CategoryMetafields | null;
  faqs?: CategoryFaq[] | null;

  productSortOrder?: unknown;
  isActive?: boolean;
  sortOrder?: number | null;

  level?: number;
  path?: string;
  url?: string;
  breadcrumb?: string[];

  directProductCount?: number;
  productCount?: number;

  createdAt?: string;
  updatedAt?: string;

  children?: CategoryNode[];
};

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  imageName: string;
  imageAltText: string;
  themeTemplate: string;
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  metafields: CategoryMetafields;
  faqs: CategoryFaq[];
  isActive: boolean;
  sortOrder: number;
};

export type CategoryTreeResponse = {
  success?: boolean;
  data?: {
    message?: string;
    settings?: unknown;
    data?: CategoryNode[];
    categories?: CategoryNode[];
  };
  error?: unknown;
};

export type CategoryDetailResponse = {
  success?: boolean;
  data?: CategoryNode;
  error?: unknown;
};

export type CategoryUpsertResponse = {
  success?: boolean;
  data?: CategoryNode;
  error?: unknown;
  message?: string;
};