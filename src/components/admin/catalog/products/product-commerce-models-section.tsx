"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, RefreshCcw, Save } from "lucide-react";

import {
  getActiveCommerceTypes,
  type CommerceTypeMaster,
} from "@/lib/admin/commerce-types-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProductRentalPricingRule,
  saveProductCommerceConfig,
  saveProductMtoConfig,
  saveProductRentalConfig,
  saveProductRentalPricingRule,
  saveProductResaleConfig,
  saveProductShopConfig,
  saveProductSubscriptionConfig,
  type ProductCommerceType,
} from "@/lib/admin/product-commerce-config-api";



type CommerceProduct = {
  mode?: string | null;
  commerceTypes?: string[] | null;
  isSellable?: boolean | null;
  isRentable?: boolean | null;

  shopSettings?: Record<string, unknown> | null;
  rentalSettings?: Record<string, unknown> | null;
  resaleSettings?: Record<string, unknown> | null;
  madeToOrderSettings?: Record<string, unknown> | null;
  subscriptionSettings?: Record<string, unknown> | null;

  rentalPrice?: number | null;
  resalePrice?: number | null;
  originalPrice?: number | null;
  listingPrice?: number | null;
  allowOffers?: boolean | null;
  minOfferPrice?: number | null;
  verificationStatus?: string | null;
  resaleCondition?: string | null;

  productionType?: string | null;
  isMadeToOrder?: boolean | null;
  allowCustomSizing?: boolean | null;
  allowRushProduction?: boolean | null;
  standardLeadTimeDays?: number | null;
  rushLeadTimeDays?: number | null;
  rushFee?: number | null;
  customSizingFinalSale?: boolean | null;

  availableForSubscription?: boolean | null;
  availableForDailyRent?: boolean | null;
  rentalCondition?: string | null;
  cleaningBufferDays?: number | null;
};

type CommerceFormState = {
  selectedTypes: ProductCommerceType[];
  defaultCommerceType: ProductCommerceType;
  showCommerceTabs: boolean;
  allowMixedCheckout: boolean;

  shopAllowCOD: boolean;
  shopAllowReturns: boolean;
  shopReturnWindowDays: number;
  shopFreeShippingAbove: number;
  shopDeliveryEstimate: string;

  rentalDailyEnabled: boolean;
  rentalSubscriptionEnabled: boolean;
  rentalDailyPrice: number;
  rentalSubscriptionPrice: number;
  rentalSecurityDeposit: number;
  rentalCleaningBufferDays: number;
  rentalCondition: string;
  rentalMinDays: number;
  rentalMaxDays: number;
  rentalLateFeePerDay: number;

  resaleCondition: string;
  resaleOriginalPrice: number;
  resaleListingPrice: number;
  resaleAllowOffers: boolean;
  resaleMinOfferPrice: number;
  resaleVerificationStatus: string;
  resaleSellerType: string;
  resaleConditionNotes: string;

  mtoAllowCustomSizing: boolean;
  mtoAllowRushProduction: boolean;
  mtoStandardLeadTimeDays: number;
  mtoRushLeadTimeDays: number;
  mtoRushFee: number;
  mtoCustomSizingFinalSale: boolean;
  mtoProductionType: string;
  mtoMeasurementRequired: boolean;
  mtoDesignerApprovalRequired: boolean;

  subscriptionMonthlyPrice: number;
  subscriptionItemsPerMonth: number;
  subscriptionSwapLimit: number;
  subscriptionAllowedPlansText: string;
  subscriptionFreeCleaningIncluded: boolean;
  subscriptionPriorityDelivery: boolean;
};

type RentalPricingRuleFormState = {
  minimumRentalDays: number;
  priceFor4Days: number;
  priceFor7Days: number;
  priceFor28Days: number;
  securityDeposit: number;
  lateFeePerDay: number;
  allowedInSubscription: boolean;
  monthlyCreditCost: number;
  premiumSurcharge: number;
};

const initialRentalPricingRuleState: RentalPricingRuleFormState = {
  minimumRentalDays: 4,
  priceFor4Days: 0,
  priceFor7Days: 0,
  priceFor28Days: 0,
  securityDeposit: 0,
  lateFeePerDay: 0,
  allowedInSubscription: false,
  monthlyCreditCost: 0,
  premiumSurcharge: 0,
};

const commerceOptions: {
  code: ProductCommerceType;
  label: string;
  description: string;
}[] = [
  {
    code: "SHOP",
    label: "Shop",
    description: "Direct retail purchase flow.",
  },
  {
    code: "RENTAL",
    label: "Rental",
    description: "Daily or subscription rental flow.",
  },
  {
    code: "RESALE",
    label: "Resale",
    description: "Pre-owned / customer resale flow.",
  },
  {
    code: "MTO",
    label: "Made to Order",
    description: "Custom sizing and production lead time flow.",
  },
  {
    code: "SUBSCRIPTION",
    label: "Subscription",
    description: "Monthly plan based rental/subscription flow.",
  },
];

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function getRecordValue(
  source: Record<string, unknown> | null | undefined,
  key: string,
) {
  if (!source || typeof source !== "object") return undefined;
  return source[key];
}

function normalizeProductCommerceType(value: unknown): ProductCommerceType | null {
  const code = String(value || "").trim().toUpperCase();

  if (code === "RETAIL" || code === "SHOP") return "SHOP";
  if (code === "RENTAL") return "RENTAL";
  if (code === "RESALE") return "RESALE";
  if (code === "MADE_TO_ORDER" || code === "MTO") return "MTO";
  if (code === "SUBSCRIPTION") return "SUBSCRIPTION";

  return null;
}

function getInitialSelectedTypes(product: CommerceProduct): ProductCommerceType[] {
  const rawTypes = Array.isArray(product.commerceTypes)
    ? product.commerceTypes
    : [];

  const mapped = rawTypes
    .map(normalizeProductCommerceType)
    .filter((item): item is ProductCommerceType => Boolean(item));

  if (mapped.length) return Array.from(new Set(mapped));

  const modeType = normalizeProductCommerceType(product.mode);

  

  if (modeType) return [modeType];

  if (product.isRentable || product.availableForDailyRent) return ["RENTAL"];
  if (product.isMadeToOrder) return ["MTO"];

  return ["SHOP"];
}

function buildInitialState(product: CommerceProduct): CommerceFormState {
  const selectedTypes = getInitialSelectedTypes(product);
  const defaultCommerceType = selectedTypes[0] || "SHOP";

  const shopSettings = product.shopSettings || {};
  const rentalSettings = product.rentalSettings || {};
  const resaleSettings = product.resaleSettings || {};



  
  
  const rentalExtra =
  getRecordValue(rentalSettings, "extra") &&
  typeof getRecordValue(rentalSettings, "extra") === "object" &&
  !Array.isArray(getRecordValue(rentalSettings, "extra"))
    ? (getRecordValue(
        rentalSettings,
        "extra",
      ) as Record<string, unknown>)
    : {};
  const mtoSettings = product.madeToOrderSettings || {};
  const subscriptionSettings = product.subscriptionSettings || {};

  return {
    selectedTypes,
    defaultCommerceType,
    showCommerceTabs: true,
    allowMixedCheckout: false,

    shopAllowCOD: booleanValue(getRecordValue(shopSettings, "allowCOD"), true),
    shopAllowReturns: booleanValue(
      getRecordValue(shopSettings, "allowReturns"),
      true,
    ),
    shopReturnWindowDays: numberValue(
      getRecordValue(shopSettings, "returnWindowDays"),
      7,
    ),
    shopFreeShippingAbove: numberValue(
      getRecordValue(shopSettings, "freeShippingAbove"),
      5000,
    ),
    shopDeliveryEstimate: String(
      getRecordValue(shopSettings, "deliveryEstimate") || "3-5 days",
    ),

    rentalDailyEnabled: booleanValue(
      getRecordValue(rentalSettings, "dailyRentalEnabled"),
      Boolean(product.availableForDailyRent),
    ),
    rentalSubscriptionEnabled: booleanValue(
      getRecordValue(rentalSettings, "subscriptionRentalEnabled"),
      Boolean(product.availableForSubscription),
    ),
    rentalDailyPrice: numberValue(
      getRecordValue(rentalSettings, "dailyPrice"),
      numberValue(product.rentalPrice, 0),
    ),
    rentalSubscriptionPrice: numberValue(
      getRecordValue(rentalSettings, "subscriptionPrice"),
      0,
    ),
    rentalSecurityDeposit: numberValue(
      getRecordValue(rentalSettings, "securityDeposit"),
      0,
    ),
    rentalCleaningBufferDays: numberValue(
      getRecordValue(rentalSettings, "cleaningBufferDays"),
      numberValue(product.cleaningBufferDays, 2),
    ),
    rentalCondition: String(
      getRecordValue(rentalSettings, "rentalCondition") ||
        product.rentalCondition ||
        "DRY_CLEANED",
    ),
    rentalMinDays: numberValue(
  getRecordValue(rentalExtra, "minRentalDays"),
  3,
),
rentalMaxDays: numberValue(
  getRecordValue(rentalExtra, "maxRentalDays"),
  15,
),
rentalLateFeePerDay: numberValue(
  getRecordValue(rentalExtra, "lateFeePerDay"),
  500,
),

    resaleCondition: String(
      getRecordValue(resaleSettings, "resaleCondition") ||
        product.resaleCondition ||
        "LIKE_NEW",
    ),
    resaleOriginalPrice: numberValue(
      getRecordValue(resaleSettings, "originalPrice"),
      numberValue(product.originalPrice, 0),
    ),
    resaleListingPrice: numberValue(
      getRecordValue(resaleSettings, "listingPrice"),
      numberValue(product.listingPrice ?? product.resalePrice, 0),
    ),
    resaleAllowOffers: booleanValue(
      getRecordValue(resaleSettings, "allowOffers"),
      Boolean(product.allowOffers),
    ),
    resaleMinOfferPrice: numberValue(
      getRecordValue(resaleSettings, "minOfferPrice"),
      numberValue(product.minOfferPrice, 0),
    ),
    resaleVerificationStatus: String(
      getRecordValue(resaleSettings, "verificationStatus") ||
        product.verificationStatus ||
        "PENDING",
    ),
    resaleSellerType: String(getRecordValue(resaleSettings, "sellerType") || "CUSTOMER"),
    resaleConditionNotes: String(
      getRecordValue(resaleSettings, "conditionNotes") || "",
    ),

    mtoAllowCustomSizing: booleanValue(
      getRecordValue(mtoSettings, "allowCustomSizing"),
      Boolean(product.allowCustomSizing),
    ),
    mtoAllowRushProduction: booleanValue(
      getRecordValue(mtoSettings, "allowRushProduction"),
      Boolean(product.allowRushProduction),
    ),
    mtoStandardLeadTimeDays: numberValue(
      getRecordValue(mtoSettings, "standardLeadTimeDays"),
      numberValue(product.standardLeadTimeDays, 21),
    ),
    mtoRushLeadTimeDays: numberValue(
      getRecordValue(mtoSettings, "rushLeadTimeDays"),
      numberValue(product.rushLeadTimeDays, 10),
    ),
    mtoRushFee: numberValue(
      getRecordValue(mtoSettings, "rushFee"),
      numberValue(product.rushFee, 0),
    ),
    mtoCustomSizingFinalSale: booleanValue(
      getRecordValue(mtoSettings, "customSizingFinalSale"),
      Boolean(product.customSizingFinalSale),
    ),
    mtoProductionType: String(
      getRecordValue(mtoSettings, "productionType") ||
        product.productionType ||
        "MADE_TO_ORDER",
    ),
    mtoMeasurementRequired: booleanValue(
      getRecordValue(mtoSettings, "measurementRequired"),
      true,
    ),
    mtoDesignerApprovalRequired: booleanValue(
      getRecordValue(mtoSettings, "designerApprovalRequired"),
      true,
    ),

    subscriptionMonthlyPrice: numberValue(
      getRecordValue(subscriptionSettings, "monthlyPrice"),
      0,
    ),
    subscriptionItemsPerMonth: numberValue(
      getRecordValue(subscriptionSettings, "itemsPerMonth"),
      3,
    ),
    subscriptionSwapLimit: numberValue(
      getRecordValue(subscriptionSettings, "swapLimit"),
      1,
    ),
    subscriptionAllowedPlansText: Array.isArray(
      getRecordValue(subscriptionSettings, "allowedPlans"),
    )
      ? (getRecordValue(subscriptionSettings, "allowedPlans") as unknown[])
          .map(String)
          .join(", ")
      : "BRIDAL_BASIC, BRIDAL_PREMIUM",
    subscriptionFreeCleaningIncluded: booleanValue(
      getRecordValue(subscriptionSettings, "freeCleaningIncluded"),
      true,
    ),
    subscriptionPriorityDelivery: booleanValue(
      getRecordValue(subscriptionSettings, "priorityDelivery"),
      true,
    ),
  };
}

export function ProductCommerceModelsSection({
  productId,
  product,
  apiRootUrl,
  token,
  onSaved,
}: {
  productId: string;
  product: CommerceProduct;
  apiRootUrl: string;
  token?: string | null;
  onSaved: () => void;
}) {
  const initialState = useMemo(() => buildInitialState(product), [product]);
  const [values, setValues] = useState<CommerceFormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pricingRuleId, setPricingRuleId] =
  useState<string | null>(null);

const [pricingRuleValues, setPricingRuleValues] =
  useState<RentalPricingRuleFormState>(
    initialRentalPricingRuleState,
  );

const [isLoadingPricingRule, setIsLoadingPricingRule] =
  useState(false);

const [isSavingPricingRule, setIsSavingPricingRule] =
  useState(false);

const [pricingRuleMessage, setPricingRuleMessage] =
  useState<string | null>(null);

const [pricingRuleError, setPricingRuleError] =
  useState<string | null>(null);

  const [activeCommerceTypes, setActiveCommerceTypes] = useState<
  CommerceTypeMaster[]
>([]);
const [isLoadingCommerceTypes, setIsLoadingCommerceTypes] = useState(true);


const activeCommerceTypeCodes = useMemo(() => {
  return new Set(
    activeCommerceTypes
      .map((item) => String(item.code || "").trim().toUpperCase())
      .filter(Boolean) as ProductCommerceType[],
  );
}, [activeCommerceTypes]);

const visibleCommerceOptions = useMemo(() => {
  if (isLoadingCommerceTypes) return [];

  return commerceOptions.filter((option) =>
    activeCommerceTypeCodes.has(option.code),
  );
}, [activeCommerceTypeCodes, isLoadingCommerceTypes]);

const allowedSelectedTypes = useMemo(() => {
  return values.selectedTypes.filter((item) =>
    activeCommerceTypeCodes.has(item),
  );
}, [values.selectedTypes, activeCommerceTypeCodes]);

const isRentalSelected =
  allowedSelectedTypes.includes("RENTAL");

  const [openConfigSections, setOpenConfigSections] = useState<
  Record<ProductCommerceType, boolean>
>({
  SHOP: initialState.selectedTypes.includes("SHOP"),
  RENTAL: initialState.selectedTypes.includes("RENTAL"),
  RESALE: initialState.selectedTypes.includes("RESALE"),
  MTO: initialState.selectedTypes.includes("MTO"),
  SUBSCRIPTION: initialState.selectedTypes.includes("SUBSCRIPTION"),
});


useEffect(() => {
  let isMounted = true;

  async function loadActiveCommerceTypes() {
    try {
      setIsLoadingCommerceTypes(true);

      const items = await getActiveCommerceTypes();

      if (!isMounted) return;

      setActiveCommerceTypes(items.filter((item) => item.isActive));
    } catch (error) {
      console.warn("ACTIVE_COMMERCE_TYPES_LOAD_FAILED:", error);

      if (!isMounted) return;

      setActiveCommerceTypes([]);
    } finally {
      if (isMounted) {
        setIsLoadingCommerceTypes(false);
      }
    }
  }

  loadActiveCommerceTypes();

  return () => {
    isMounted = false;
  };
}, []);

useEffect(() => {
  let isMounted = true;

  async function loadRentalPricingRule() {
    if (!isRentalSelected || !productId) {
      setPricingRuleId(null);
      setPricingRuleValues(
        initialRentalPricingRuleState,
      );
      setPricingRuleError(null);
      setPricingRuleMessage(null);
      return;
    }

    try {
      setIsLoadingPricingRule(true);
      setPricingRuleError(null);

      const rule =
        await getProductRentalPricingRule({
          apiRootUrl,
          productId,
          token,
        });

      if (!isMounted) return;

      if (!rule) {
        setPricingRuleId(null);

      setPricingRuleValues({
  ...initialRentalPricingRuleState,
  minimumRentalDays:
    initialState.rentalMinDays > 0
      ? initialState.rentalMinDays
      : 4,
  securityDeposit:
    initialState.rentalSecurityDeposit,
  lateFeePerDay:
    initialState.rentalLateFeePerDay,
  allowedInSubscription:
    initialState.rentalSubscriptionEnabled,
});

        return;
      }

      setPricingRuleId(rule.id);

      setPricingRuleValues({
        minimumRentalDays:
          numberValue(rule.minimumRentalDays, 4),
        priceFor4Days:
          numberValue(rule.priceFor4Days, 0),
        priceFor7Days:
          numberValue(rule.priceFor7Days, 0),
        priceFor28Days:
          numberValue(rule.priceFor28Days, 0),
        securityDeposit:
          numberValue(rule.securityDeposit, 0),
        lateFeePerDay:
          numberValue(rule.lateFeePerDay, 0),
        allowedInSubscription:
          Boolean(rule.allowedInSubscription),
        monthlyCreditCost:
          numberValue(rule.monthlyCreditCost, 0),
        premiumSurcharge:
          numberValue(rule.premiumSurcharge, 0),
      });
    } catch (loadError) {
      if (!isMounted) return;

      setPricingRuleId(null);

      setPricingRuleError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load the rental pricing rule.",
      );
    } finally {
      if (isMounted) {
        setIsLoadingPricingRule(false);
      }
    }
  }

  void loadRentalPricingRule();

  return () => {
    isMounted = false;
  };
}, [
  apiRootUrl,
  productId,
  token,
  isRentalSelected,
  initialState,
]);

useEffect(() => {
  if (isLoadingCommerceTypes) return;

  const filteredSelectedTypes = initialState.selectedTypes.filter((item) =>
    activeCommerceTypeCodes.has(item),
  );

  const selectedTypes: ProductCommerceType[] = filteredSelectedTypes.length
    ? filteredSelectedTypes
    : visibleCommerceOptions[0]
      ? [visibleCommerceOptions[0].code]
      : [];

  const defaultCommerceType: ProductCommerceType =
    selectedTypes.includes(initialState.defaultCommerceType)
      ? initialState.defaultCommerceType
      : selectedTypes[0] || initialState.defaultCommerceType;

  setValues({
    ...initialState,
    selectedTypes,
    defaultCommerceType,
  });

  setOpenConfigSections({
    SHOP: selectedTypes.includes("SHOP"),
    RENTAL: selectedTypes.includes("RENTAL"),
    RESALE: selectedTypes.includes("RESALE"),
    MTO: selectedTypes.includes("MTO"),
    SUBSCRIPTION: selectedTypes.includes("SUBSCRIPTION"),
  });
}, [
  initialState,
  activeCommerceTypeCodes,
  visibleCommerceOptions,
  isLoadingCommerceTypes,
]);

  function updateValue<K extends keyof CommerceFormState>(
    key: K,
    value: CommerceFormState[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updatePricingRuleValue<
  K extends keyof RentalPricingRuleFormState,
>(
  key: K,
  value: RentalPricingRuleFormState[K],
) {
  setPricingRuleValues((current) => ({
    ...current,
    [key]: value,
  }));
}

  function toggleConfigSection(code: ProductCommerceType) {
  setOpenConfigSections((current) => ({
    ...current,
    [code]: !current[code],
  }));
}
function toggleCommerceType(code: ProductCommerceType) {
  if (!activeCommerceTypeCodes.has(code)) {
    setError(
   `${code} is not active in the global Commerce Models master. Create or activate it first.`,
    );
    return;
  }

  setValues((current) => {
    const exists = current.selectedTypes.includes(code);

    const nextSelected: ProductCommerceType[] = exists
      ? current.selectedTypes.filter((item) => item !== code)
      : [...current.selectedTypes, code];

    const safeSelected: ProductCommerceType[] = nextSelected.filter((item) =>
      activeCommerceTypeCodes.has(item),
    );

    const safeDefault: ProductCommerceType =
      safeSelected.length && safeSelected.includes(current.defaultCommerceType)
        ? current.defaultCommerceType
        : safeSelected[0] || code;

    if (!exists) {
      setOpenConfigSections((sectionState) => ({
        ...sectionState,
        [code]: true,
      }));
    }

    return {
      ...current,
      selectedTypes: safeSelected,
      defaultCommerceType: safeDefault,
    };
  });
}

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

const selectedTypes: ProductCommerceType[] = values.selectedTypes.filter(
  (item) => activeCommerceTypeCodes.has(item),
);

if (!selectedTypes.length) {
  throw new Error(
   "No active commerce model is selected. Create or activate a commerce type in the Commerce Models master.",
  );
}

const defaultCommerceType: ProductCommerceType = selectedTypes.includes(
  values.defaultCommerceType,
)
  ? values.defaultCommerceType
  : selectedTypes[0];

      await saveProductCommerceConfig({
        apiRootUrl,
        productId,
        token,
        payload: {
          commerceTypes: selectedTypes,
          defaultCommerceType,
          mode: "retail",
          isSellable:
            selectedTypes.includes("SHOP") ||
            selectedTypes.includes("RESALE") ||
            selectedTypes.includes("MTO"),
          isRentable:
            selectedTypes.includes("RENTAL") ||
            selectedTypes.includes("SUBSCRIPTION"),
          settings: {
            showCommerceTabs: values.showCommerceTabs,
            defaultTab: defaultCommerceType,
            allowMixedCheckout: values.allowMixedCheckout,
          },
        },
      });

      if (selectedTypes.includes("SHOP")) {
        await saveProductShopConfig({
          apiRootUrl,
          productId,
          token,
          payload: {
            allowCOD: values.shopAllowCOD,
            allowReturns: values.shopAllowReturns,
            returnWindowDays: values.shopReturnWindowDays,
            extra: {
              freeShippingAbove: values.shopFreeShippingAbove,
              deliveryEstimate: values.shopDeliveryEstimate,
            },
          },
        });
      }

   if (selectedTypes.includes("RENTAL")) {
  if (
    values.rentalDailyEnabled &&
    values.rentalDailyPrice <= 0
  ) {
    throw new Error(
      "Daily Rental enabled hai, isliye Daily Price 0 se greater hona chahiye.",
    );
  }

  if (
    values.rentalSubscriptionEnabled &&
    values.rentalSubscriptionPrice <= 0
  ) {
    throw new Error(
      "Subscription Rental enabled hai, isliye Subscription Price 0 se greater hona chahiye.",
    );
  }

  if (values.rentalMinDays < 1) {
    throw new Error(
      "Minimum rental days kam se kam 1 hona chahiye.",
    );
  }

  if (
    values.rentalMaxDays <
    values.rentalMinDays
  ) {
    throw new Error(
      "Maximum rental days, minimum rental days se kam nahi ho sakta.",
    );
  }

  await saveProductRentalConfig({
    apiRootUrl,
    productId,
    token,
    payload: {
      enabled: true,
      dailyRentalEnabled:
        values.rentalDailyEnabled,
      subscriptionRentalEnabled:
        values.rentalSubscriptionEnabled,
      dailyPrice: values.rentalDailyPrice,
      subscriptionPrice:
        values.rentalSubscriptionPrice,
      securityDeposit:
        values.rentalSecurityDeposit,
      cleaningBufferDays:
        values.rentalCleaningBufferDays,
      rentalCondition:
        values.rentalCondition.trim(),
      extra: {
        minRentalDays: values.rentalMinDays,
        maxRentalDays: values.rentalMaxDays,
        lateFeePerDay:
          values.rentalLateFeePerDay,
      },
    },
  });
} else if (
  initialState.selectedTypes.includes("RENTAL")
) {
  await saveProductRentalConfig({
    apiRootUrl,
    productId,
    token,
    payload: {
      enabled: false,
      dailyRentalEnabled: false,
      subscriptionRentalEnabled: false,
      dailyPrice: values.rentalDailyPrice,
      subscriptionPrice:
        values.rentalSubscriptionPrice,
      securityDeposit:
        values.rentalSecurityDeposit,
      cleaningBufferDays:
        values.rentalCleaningBufferDays,
      rentalCondition:
        values.rentalCondition.trim(),
      extra: {
        minRentalDays: values.rentalMinDays,
        maxRentalDays: values.rentalMaxDays,
        lateFeePerDay:
          values.rentalLateFeePerDay,
      },
    },
  });
}

      if (selectedTypes.includes("RESALE")) {
        await saveProductResaleConfig({
          apiRootUrl,
          productId,
          token,
          payload: {
            enabled: true,
            resaleCondition: values.resaleCondition,
            originalPrice: values.resaleOriginalPrice,
            listingPrice: values.resaleListingPrice,
            allowOffers: values.resaleAllowOffers,
            minOfferPrice: values.resaleMinOfferPrice,
            verificationStatus: values.resaleVerificationStatus,
            extra: {
              conditionNotes: values.resaleConditionNotes,
              sellerType: values.resaleSellerType,
            },
          },
        });
      }

      if (selectedTypes.includes("MTO")) {
        await saveProductMtoConfig({
          apiRootUrl,
          productId,
          token,
          payload: {
            enabled: true,
            allowCustomSizing: values.mtoAllowCustomSizing,
            allowRushProduction: values.mtoAllowRushProduction,
            standardLeadTimeDays: values.mtoStandardLeadTimeDays,
            rushLeadTimeDays: values.mtoRushLeadTimeDays,
            rushFee: values.mtoRushFee,
            customSizingFinalSale: values.mtoCustomSizingFinalSale,
            productionType: values.mtoProductionType,
            extra: {
              measurementRequired: values.mtoMeasurementRequired,
              designerApprovalRequired: values.mtoDesignerApprovalRequired,
            },
          },
        });
      }

      if (selectedTypes.includes("SUBSCRIPTION")) {
        await saveProductSubscriptionConfig({
          apiRootUrl,
          productId,
          token,
          payload: {
            enabled: true,
            monthlyPrice: values.subscriptionMonthlyPrice,
            itemsPerMonth: values.subscriptionItemsPerMonth,
            swapLimit: values.subscriptionSwapLimit,
            allowedPlans: values.subscriptionAllowedPlansText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            extra: {
              freeCleaningIncluded: values.subscriptionFreeCleaningIncluded,
              priorityDelivery: values.subscriptionPriorityDelivery,
            },
          },
        });
      }
setMessage("Product commerce models saved successfully.");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Product commerce models save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveRentalPricingRule() {
  try {
    setIsSavingPricingRule(true);
    setPricingRuleError(null);
    setPricingRuleMessage(null);

    if (!productId.trim()) {
      throw new Error("Product ID is missing.");
    }

    if (pricingRuleValues.minimumRentalDays < 1) {
      throw new Error(
        "Minimum rental days must be at least 1.",
      );
    }

    if (pricingRuleValues.priceFor4Days < 0) {
      throw new Error(
        "Price for 4 days cannot be negative.",
      );
    }

    if (pricingRuleValues.priceFor7Days < 0) {
      throw new Error(
        "Price for 7 days cannot be negative.",
      );
    }

    if (pricingRuleValues.priceFor28Days < 0) {
      throw new Error(
        "Price for 28 days cannot be negative.",
      );
    }

    if (pricingRuleValues.securityDeposit < 0) {
      throw new Error(
        "Security deposit cannot be negative.",
      );
    }

    if (pricingRuleValues.lateFeePerDay < 0) {
      throw new Error(
        "Late fee per day cannot be negative.",
      );
    }

    if (pricingRuleValues.monthlyCreditCost < 0) {
      throw new Error(
        "Monthly credit cost cannot be negative.",
      );
    }

    if (pricingRuleValues.premiumSurcharge < 0) {
      throw new Error(
        "Premium surcharge cannot be negative.",
      );
    }

    await saveProductRentalPricingRule({
      apiRootUrl,
      token,
      payload: {
        productId,
        minimumRentalDays:
          pricingRuleValues.minimumRentalDays,
        priceFor4Days:
          pricingRuleValues.priceFor4Days,
        priceFor7Days:
          pricingRuleValues.priceFor7Days,
        priceFor28Days:
          pricingRuleValues.priceFor28Days,
        securityDeposit:
          pricingRuleValues.securityDeposit,
        lateFeePerDay:
          pricingRuleValues.lateFeePerDay,
        allowedInSubscription:
          pricingRuleValues.allowedInSubscription,
        monthlyCreditCost:
          pricingRuleValues.monthlyCreditCost,
        premiumSurcharge:
          pricingRuleValues.premiumSurcharge,
      },
    });

    const refreshedRule =
      await getProductRentalPricingRule({
        apiRootUrl,
        productId,
        token,
      });

    if (refreshedRule) {
      setPricingRuleId(refreshedRule.id);

      setPricingRuleValues({
        minimumRentalDays:
          numberValue(
            refreshedRule.minimumRentalDays,
            4,
          ),
        priceFor4Days:
          numberValue(
            refreshedRule.priceFor4Days,
            0,
          ),
        priceFor7Days:
          numberValue(
            refreshedRule.priceFor7Days,
            0,
          ),
        priceFor28Days:
          numberValue(
            refreshedRule.priceFor28Days,
            0,
          ),
        securityDeposit:
          numberValue(
            refreshedRule.securityDeposit,
            0,
          ),
        lateFeePerDay:
          numberValue(
            refreshedRule.lateFeePerDay,
            0,
          ),
        allowedInSubscription:
          Boolean(
            refreshedRule.allowedInSubscription,
          ),
        monthlyCreditCost:
          numberValue(
            refreshedRule.monthlyCreditCost,
            0,
          ),
        premiumSurcharge:
          numberValue(
            refreshedRule.premiumSurcharge,
            0,
          ),
      });
    }

    setPricingRuleMessage(
      pricingRuleId
        ? "Rental pricing rule updated successfully."
        : "Rental pricing rule created successfully.",
    );
  } catch (saveError) {
    setPricingRuleError(
      saveError instanceof Error
        ? saveError.message
        : "Failed to save the rental pricing rule.",
    );
  } finally {
    setIsSavingPricingRule(false);
  }
}

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Commerce Models
          </p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Product Commerce Configuration
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-neutral-500">
            Choose how this product can be sold or used: shop, rental, resale,
            made-to-order or subscription.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
        >
          {isSaving ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Commerce
            </>
          )}
        </Button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

     {isLoadingCommerceTypes ? (
  <div className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
Active commerce models are loading...
  </div>
) : !visibleCommerceOptions.length ? (
  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
  No active commerce model is available. Create or activate a commerce
type under Catalog Management &gt; Commerce Models.
  </div>
) : (
  <div className="mt-5 grid gap-3 md:grid-cols-5">
    {visibleCommerceOptions.map((option) => {
          const checked = values.selectedTypes.includes(option.code);

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => toggleCommerceType(option.code)}
        className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                checked
                  ? "border-[#b88a44] bg-[#fff4df] text-[#6f4a16]"
                  : "border-neutral-200 bg-[#fbfaf6] text-neutral-800 hover:border-[#d4b47a]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{option.label}</p>

                {checked ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#b88a44] text-white">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-xs leading-relaxed opacity-80">
                {option.description}
              </p>
            </button>
          );
         })}
  </div>
)}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <SelectField
          label="Default Commerce Type"
          value={values.defaultCommerceType}
          onChange={(value) =>
            updateValue("defaultCommerceType", value as ProductCommerceType)
          }
       options={allowedSelectedTypes.map((item) => ({
  label: item,
  value: item,
}))}
        />

        <CheckboxField
          label="Show commerce tabs"
          checked={values.showCommerceTabs}
          onChange={(checked) => updateValue("showCommerceTabs", checked)}
        />

        <CheckboxField
          label="Allow mixed checkout"
          checked={values.allowMixedCheckout}
          onChange={(checked) => updateValue("allowMixedCheckout", checked)}
        />
      </div>

      <div className="mt-6 space-y-5">
     {allowedSelectedTypes.includes("SHOP") ? (
         <ConfigCard
  title="Shop Config"
  code="SHOP"
  isOpen={openConfigSections.SHOP}
  onToggle={() => toggleConfigSection("SHOP")}
>
            <CheckboxField
              label="Allow COD"
              checked={values.shopAllowCOD}
              onChange={(checked) => updateValue("shopAllowCOD", checked)}
            />
            <CheckboxField
              label="Allow Returns"
              checked={values.shopAllowReturns}
              onChange={(checked) => updateValue("shopAllowReturns", checked)}
            />
            <NumberField
              label="Return Window Days"
              value={values.shopReturnWindowDays}
              onChange={(value) => updateValue("shopReturnWindowDays", value)}
            />
            <NumberField
              label="Free Shipping Above"
              value={values.shopFreeShippingAbove}
              onChange={(value) => updateValue("shopFreeShippingAbove", value)}
            />
            <TextField
              label="Delivery Estimate"
              value={values.shopDeliveryEstimate}
              onChange={(value) => updateValue("shopDeliveryEstimate", value)}
            />
          </ConfigCard>
        ) : null}

        {allowedSelectedTypes.includes("RENTAL") ? (
         <ConfigCard
  title="Rental Config"
  code="RENTAL"
  isOpen={openConfigSections.RENTAL}
  onToggle={() => toggleConfigSection("RENTAL")}
>
            <CheckboxField
              label="Daily Rental"
              checked={values.rentalDailyEnabled}
              onChange={(checked) => updateValue("rentalDailyEnabled", checked)}
            />
            <CheckboxField
              label="Subscription Rental"
              checked={values.rentalSubscriptionEnabled}
              onChange={(checked) =>
                updateValue("rentalSubscriptionEnabled", checked)
              }
            />
            <NumberField
              label="Daily Price"
              value={values.rentalDailyPrice}
              onChange={(value) => updateValue("rentalDailyPrice", value)}
            />
            <NumberField
              label="Subscription Price"
              value={values.rentalSubscriptionPrice}
              onChange={(value) =>
                updateValue("rentalSubscriptionPrice", value)
              }
            />
            <NumberField
              label="Security Deposit"
              value={values.rentalSecurityDeposit}
              onChange={(value) => updateValue("rentalSecurityDeposit", value)}
            />
            <NumberField
              label="Cleaning Buffer Days"
              value={values.rentalCleaningBufferDays}
              onChange={(value) =>
                updateValue("rentalCleaningBufferDays", value)
              }
            />
            <TextField
              label="Rental Condition"
              value={values.rentalCondition}
              onChange={(value) => updateValue("rentalCondition", value)}
            />
            <NumberField
              label="Min Rental Days"
              value={values.rentalMinDays}
              onChange={(value) => updateValue("rentalMinDays", value)}
            />
            <NumberField
              label="Max Rental Days"
              value={values.rentalMaxDays}
              onChange={(value) => updateValue("rentalMaxDays", value)}
            />
            <NumberField
              label="Late Fee Per Day"
              value={values.rentalLateFeePerDay}
              onChange={(value) => updateValue("rentalLateFeePerDay", value)}
            />
          </ConfigCard>
        ) : null}

        {isRentalSelected ? (
  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#fbfaf6]">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 px-4 py-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-950">
            Rental Pricing Rule
          </h3>

          <span className="rounded-full border border-[#e0c18a] bg-[#fff4df] px-2.5 py-1 text-xs font-medium text-[#6f4a16]">
            {pricingRuleId
              ? "EXISTING RULE"
              : "NEW RULE"}
          </span>
        </div>

        <p className="mt-1 text-xs text-neutral-500">
          Configure product-level rental prices.
          Saving uses the backend product-level upsert.
        </p>

        {pricingRuleId ? (
          <p className="mt-1 text-[11px] text-neutral-400">
            Rule ID: {pricingRuleId}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        onClick={handleSaveRentalPricingRule}
        disabled={
          isSavingPricingRule ||
          isLoadingPricingRule
        }
        className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
      >
        {isSavingPricingRule ? (
          <>
            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Pricing Rule
          </>
        )}
      </Button>
    </div>

    {pricingRuleMessage ? (
      <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {pricingRuleMessage}
      </div>
    ) : null}

    {pricingRuleError ? (
      <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {pricingRuleError}
      </div>
    ) : null}

    {isLoadingPricingRule ? (
      <div className="p-6 text-sm text-neutral-500">
        Loading rental pricing rule...
      </div>
    ) : (
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <NumberField
          label="Minimum Rental Days"
          value={
            pricingRuleValues.minimumRentalDays
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "minimumRentalDays",
              value,
            )
          }
        />

        <NumberField
          label="Price for 4 Days"
          value={
            pricingRuleValues.priceFor4Days
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "priceFor4Days",
              value,
            )
          }
        />

        <NumberField
          label="Price for 7 Days"
          value={
            pricingRuleValues.priceFor7Days
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "priceFor7Days",
              value,
            )
          }
        />

        <NumberField
          label="Price for 28 Days"
          value={
            pricingRuleValues.priceFor28Days
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "priceFor28Days",
              value,
            )
          }
        />

        <NumberField
          label="Security Deposit"
          value={
            pricingRuleValues.securityDeposit
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "securityDeposit",
              value,
            )
          }
        />

        <NumberField
          label="Late Fee Per Day"
          value={
            pricingRuleValues.lateFeePerDay
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "lateFeePerDay",
              value,
            )
          }
        />

        <CheckboxField
          label="Allowed in Subscription"
          checked={
            pricingRuleValues.allowedInSubscription
          }
          onChange={(checked) =>
            updatePricingRuleValue(
              "allowedInSubscription",
              checked,
            )
          }
        />

        <NumberField
          label="Monthly Credit Cost"
          value={
            pricingRuleValues.monthlyCreditCost
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "monthlyCreditCost",
              value,
            )
          }
        />

        <NumberField
          label="Premium Surcharge"
          value={
            pricingRuleValues.premiumSurcharge
          }
          onChange={(value) =>
            updatePricingRuleValue(
              "premiumSurcharge",
              value,
            )
          }
        />
      </div>
    )}
  </div>
) : null}

        {allowedSelectedTypes.includes("RESALE") ? (
        <ConfigCard
  title="Resale Config"
  code="RESALE"
  isOpen={openConfigSections.RESALE}
  onToggle={() => toggleConfigSection("RESALE")}
>
            <TextField
              label="Resale Condition"
              value={values.resaleCondition}
              onChange={(value) => updateValue("resaleCondition", value)}
            />
            <NumberField
              label="Original Price"
              value={values.resaleOriginalPrice}
              onChange={(value) => updateValue("resaleOriginalPrice", value)}
            />
            <NumberField
              label="Listing Price"
              value={values.resaleListingPrice}
              onChange={(value) => updateValue("resaleListingPrice", value)}
            />
            <CheckboxField
              label="Allow Offers"
              checked={values.resaleAllowOffers}
              onChange={(checked) => updateValue("resaleAllowOffers", checked)}
            />
            <NumberField
              label="Min Offer Price"
              value={values.resaleMinOfferPrice}
              onChange={(value) => updateValue("resaleMinOfferPrice", value)}
            />
            <TextField
              label="Verification Status"
              value={values.resaleVerificationStatus}
              onChange={(value) =>
                updateValue("resaleVerificationStatus", value)
              }
            />
            <TextField
              label="Seller Type"
              value={values.resaleSellerType}
              onChange={(value) => updateValue("resaleSellerType", value)}
            />
            <TextField
              label="Condition Notes"
              value={values.resaleConditionNotes}
              onChange={(value) => updateValue("resaleConditionNotes", value)}
            />
          </ConfigCard>
        ) : null}

        {allowedSelectedTypes.includes("MTO") ? (
        <ConfigCard
  title="Made To Order Config"
  code="MTO"
  isOpen={openConfigSections.MTO}
  onToggle={() => toggleConfigSection("MTO")}
>
            <CheckboxField
              label="Allow Custom Sizing"
              checked={values.mtoAllowCustomSizing}
              onChange={(checked) => updateValue("mtoAllowCustomSizing", checked)}
            />
            <CheckboxField
              label="Allow Rush Production"
              checked={values.mtoAllowRushProduction}
              onChange={(checked) =>
                updateValue("mtoAllowRushProduction", checked)
              }
            />
            <NumberField
              label="Standard Lead Time Days"
              value={values.mtoStandardLeadTimeDays}
              onChange={(value) => updateValue("mtoStandardLeadTimeDays", value)}
            />
            <NumberField
              label="Rush Lead Time Days"
              value={values.mtoRushLeadTimeDays}
              onChange={(value) => updateValue("mtoRushLeadTimeDays", value)}
            />
            <NumberField
              label="Rush Fee"
              value={values.mtoRushFee}
              onChange={(value) => updateValue("mtoRushFee", value)}
            />
            <CheckboxField
              label="Custom Sizing Final Sale"
              checked={values.mtoCustomSizingFinalSale}
              onChange={(checked) =>
                updateValue("mtoCustomSizingFinalSale", checked)
              }
            />
            <TextField
              label="Production Type"
              value={values.mtoProductionType}
              onChange={(value) => updateValue("mtoProductionType", value)}
            />
            <CheckboxField
              label="Measurement Required"
              checked={values.mtoMeasurementRequired}
              onChange={(checked) =>
                updateValue("mtoMeasurementRequired", checked)
              }
            />
            <CheckboxField
              label="Designer Approval Required"
              checked={values.mtoDesignerApprovalRequired}
              onChange={(checked) =>
                updateValue("mtoDesignerApprovalRequired", checked)
              }
            />
          </ConfigCard>
        ) : null}

        {allowedSelectedTypes.includes("SUBSCRIPTION") ? (
      <ConfigCard
  title="Subscription Config"
  code="SUBSCRIPTION"
  isOpen={openConfigSections.SUBSCRIPTION}
  onToggle={() => toggleConfigSection("SUBSCRIPTION")}
>
            <NumberField
              label="Monthly Price"
              value={values.subscriptionMonthlyPrice}
              onChange={(value) => updateValue("subscriptionMonthlyPrice", value)}
            />
            <NumberField
              label="Items Per Month"
              value={values.subscriptionItemsPerMonth}
              onChange={(value) =>
                updateValue("subscriptionItemsPerMonth", value)
              }
            />
            <NumberField
              label="Swap Limit"
              value={values.subscriptionSwapLimit}
              onChange={(value) => updateValue("subscriptionSwapLimit", value)}
            />
            <TextField
              label="Allowed Plans"
              value={values.subscriptionAllowedPlansText}
              onChange={(value) =>
                updateValue("subscriptionAllowedPlansText", value)
              }
            />
            <CheckboxField
              label="Free Cleaning Included"
              checked={values.subscriptionFreeCleaningIncluded}
              onChange={(checked) =>
                updateValue("subscriptionFreeCleaningIncluded", checked)
              }
            />
            <CheckboxField
              label="Priority Delivery"
              checked={values.subscriptionPriorityDelivery}
              onChange={(checked) =>
                updateValue("subscriptionPriorityDelivery", checked)
              }
            />
          </ConfigCard>
        ) : null}
      </div>
    </section>
  );
}

function ConfigCard({
  title,
  code,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  code: ProductCommerceType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#fbfaf6]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-[#f4ead8]"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>

            <span className="rounded-full border border-[#e0c18a] bg-[#fff4df] px-2.5 py-1 text-xs font-medium text-[#6f4a16]">
              {code}
            </span>
          </div>

          <p className="mt-1 text-xs text-neutral-500">
           {isOpen ? "Settings are visible." : "Settings hidden. Click to configure."}
          </p>
        </div>

        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-4 border-t border-neutral-200 p-4 md:grid-cols-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </span>
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(numberValue(event.target.value, 0))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}