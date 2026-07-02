"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminToken } from "@/lib/admin-auth";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  FileSearch,
  Globe2,
  ImageIcon,
  Link2,
  RefreshCcw,
  SearchCheck,
  Sparkles,
} from "lucide-react";

type SeoMetricStatus = "GOOD" | "WARNING" | "CRITICAL";

type SeoMetric = {
  value: number;
  note: string;
  status: SeoMetricStatus;
};

type SeoScoreMetric = SeoMetric & {
  total: number;
};

type SeoRevenueMetric = SeoMetric & {
  currency: string;
};

type CoverageItem = {
  key: string;
  label: string;
  value: number;
};

type SeoPageRevenueRow = {
  url: string;
  sessions?: number;
  conversionRate?: number;
  revenue: number;
  currency: string;
};

type SeoConversionRateRow = {
  url: string;
  conversionRate: number;
};

type SeoIssue = {
  id: string;
  title: string;
  count: number;
  area: string;
  severity: SeoMetricStatus;
  targetPath?: string;
};

type SeoOpportunity = {
  id: string;
  title: string;
  description: string;
  area: "Palette SEO" | "Real Wedding SEO" | "Swatch SEO" | "MTO SEO" | "Rental SEO";
  targetPath?: string;
};

type SeoDashboardData = {
  coreMetrics: {
    seoHealthScore: SeoScoreMetric;
    indexedPages: SeoMetric;
    nonIndexedPages: SeoMetric;
    brokenUrls: SeoMetric;
    duplicateTitles: SeoMetric;
    missingMetaDescriptions: SeoMetric;
    missingAltText: SeoMetric;
    missingSchema: SeoMetric;
    orphanPages: SeoMetric;
    redirectErrors: SeoMetric;
    organicTraffic: SeoMetric;
    revenueFromOrganic: SeoRevenueMetric;
  };

  indexing: {
    indexedPages: number;
    nonIndexedPages: number;
    indexCoveragePercent: number;
    crawlErrors: number;
    coverageByType: CoverageItem[];
  };

  metadataIssues: {
    missingSeoTitles: number;
    missingMetaDescriptions: number;
    missingH1: number;
    missingCanonicals: number;
    duplicateTitles: number;
    duplicateMetaDescriptions: number;
    duplicateContent: number;
  };

  imageSeo: {
    missingAltText: number;
    duplicateAltText: number;
    largeImages: number;
    unoptimizedImages: number;
    missingTitles: number;
    missingCaptions: number;
  };

  structuredData: {
    missingSchema: number;
    schemaErrors: number;
    richResultEligibility: number;
  };

  technicalSeo: {
    brokenUrls: number;
    redirectErrors: number;
    orphanPages: number;
    sitemapErrors: number;
    robotsIssues: number;
  };

  organicPerformance: {
    organicTraffic: number;
    organicRevenue: number;
    currency: string;
    topLandingPages: SeoPageRevenueRow[];
    topConvertingPages: SeoPageRevenueRow[];
    highestRevenuePages: SeoPageRevenueRow[];
    conversionRateByLandingPage: SeoConversionRateRow[];
  };

  contentOpportunities: {
    missingFaqSchema: number;
    missingBuyingGuides: number;
    missingInternalLinks: number;
    thinContentPages: number;
    aiSuggestions: number;
  };

  shahsiSpecificWidgets: {
    paletteSeo: {
      topPalettePages: number;
      topWeddingColorSearches: number;
    };
    realWeddingSeo: {
      topWeddingGalleries: number;
      weddingGalleryRevenueAttribution: number;
    };
    swatchSeo: {
      mostViewedSwatchPages: number;
      swatchToOrderConversion: number;
    };
    rentalSeo: {
      rentalLandingTraffic: number;
      rentalConversionRate: number;
    };
    mtoSeo: {
      madeToOrderLandingTraffic: number;
      customLengthTraffic: number;
      rushProductionTraffic: number;
    };
  };

  issueQueue: SeoIssue[];
  opportunities: SeoOpportunity[];
  lastUpdatedAt: string;
};

type SeoDashboardResponse = {
  data: SeoDashboardData;
};

const metricOrder: Array<{
  key: keyof SeoDashboardData["coreMetrics"];
  label: string;
}> = [
  { key: "indexedPages", label: "Indexed Pages" },
  { key: "nonIndexedPages", label: "Non Indexed Pages" },
  { key: "brokenUrls", label: "Broken URLs" },
  { key: "duplicateTitles", label: "Duplicate Titles" },
  { key: "missingMetaDescriptions", label: "Missing Meta Descriptions" },
  { key: "missingAltText", label: "Missing Alt Text" },
  { key: "missingSchema", label: "Missing Schema" },
  { key: "orphanPages", label: "Orphan Pages" },
  { key: "redirectErrors", label: "Redirect Errors" },
  { key: "organicTraffic", label: "Organic Traffic" },
  { key: "revenueFromOrganic", label: "Revenue From Organic" },
];

export default function SeoDashboardPage() {
  const [dashboard, setDashboard] = useState<SeoDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"rescan" | "generate" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin token missing hai. Please login again.");
    }

    const response = await fetch(`/api/proxy${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    const text = await response.text();

    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : `API failed: ${response.status} ${response.statusText}`;

      throw new Error(message);
    }

    return data as T;
  }

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<SeoDashboardResponse>(
        "/admin/seo/dashboard",
      );

      setDashboard(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "SEO dashboard fetch failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function runDashboardAction(action: "rescan" | "generate") {
    try {
      setActionLoading(action);
      setError(null);
      setNotice(null);

      const path =
        action === "rescan"
          ? "/admin/seo/dashboard/rescan"
          : "/admin/seo/dashboard/generate-fixes";

      await apiRequest(path, {
        method: "POST",
        body: JSON.stringify({
          note: "Triggered from SEO admin dashboard",
          limit: 25,
          dryRun: false,
        }),
      });

      setNotice(
        action === "rescan"
          ? "SEO rescan queued successfully."
          : "SEO fix generation queued successfully.",
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "SEO dashboard action failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!dashboard?.lastUpdatedAt) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dashboard.lastUpdatedAt));
  }, [dashboard?.lastUpdatedAt]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-8 text-center">
          <p className="font-medium text-neutral-950">
            Loading SEO dashboard...
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Backend se latest SEO audit data fetch ho raha hai.
          </p>
        </Card>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <Card className="rounded-[1.5rem] border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">
            SEO dashboard data load nahi hua.
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <Button className="mt-5 rounded-full" onClick={loadDashboard}>
            Retry
          </Button>
        </Card>
      </main>
    );
  }

  const healthScore = dashboard.coreMetrics.seoHealthScore;

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / SEO / Dashboard
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              SEO Dashboard
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Live SEO health, indexing, metadata, image SEO, schema,
              technical SEO, organic performance, opportunities, and task queue.
            </p>

            <p className="mt-3 text-sm text-white/50">
              Last updated: {lastUpdatedLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="rounded-full"
              disabled={actionLoading !== null}
              onClick={() => runDashboardAction("rescan")}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {actionLoading === "rescan" ? "Re-scanning..." : "Re-scan SEO"}
            </Button>

            <Button
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
              disabled={actionLoading !== null}
              onClick={() => runDashboardAction("generate")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {actionLoading === "generate"
                ? "Generating..."
                : "Generate Fixes"}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                SEO Health Score
              </p>

              <h2 className="mt-4 text-6xl font-medium tracking-tight">
                {healthScore.value}
                <span className="text-2xl text-neutral-400">
                  /{healthScore.total}
                </span>
              </h2>

              <p className="mt-3 text-sm text-neutral-500">
                {healthScore.note}
              </p>
            </div>

            <StatusBadge status={healthScore.status} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricOrder.slice(0, 4).map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              metric={dashboard.coreMetrics[metric.key]}
            />
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricOrder.slice(4).map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            metric={dashboard.coreMetrics[metric.key]}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<Globe2 className="h-5 w-5" />}
            eyebrow="indexing"
            title="Index coverage"
          />

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MiniStat
              label="Indexed"
              value={dashboard.indexing.indexedPages}
              suffix="pages"
            />
            <MiniStat
              label="Non Indexed"
              value={dashboard.indexing.nonIndexedPages}
              suffix="pages"
            />
            <MiniStat
              label="Coverage"
              value={dashboard.indexing.indexCoveragePercent}
              suffix="%"
            />
            <MiniStat
              label="Crawl Errors"
              value={dashboard.indexing.crawlErrors}
              suffix="errors"
            />
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.indexing.coverageByType.map((item) => (
              <ProgressRow
                key={item.key}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<FileSearch className="h-5 w-5" />}
            eyebrow="seo task queue"
            title="Highest priority fixes"
          />

          <div className="mt-5 space-y-3">
            {dashboard.issueQueue.length ? (
              dashboard.issueQueue.map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-col gap-4 rounded-2xl bg-[#f7f2ea] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-950">
                        {issue.title}
                      </p>
                      <StatusBadge status={issue.severity} />
                    </div>

                    <p className="mt-1 text-sm text-neutral-500">
                      {issue.count} issues · {issue.area}
                    </p>
                  </div>

                  {issue.targetPath ? (
                    <Button asChild size="sm" className="rounded-full">
                      <Link href={issue.targetPath}>
                        Fix
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState text="No SEO issues in queue." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-4">
        <IssueGroupCard
          icon={<SearchCheck className="h-5 w-5" />}
          eyebrow="metadata"
          title="Metadata issues"
          rows={[
            ["Missing SEO Titles", dashboard.metadataIssues.missingSeoTitles],
            [
              "Missing Meta Descriptions",
              dashboard.metadataIssues.missingMetaDescriptions,
            ],
            ["Missing H1", dashboard.metadataIssues.missingH1],
            ["Missing Canonicals", dashboard.metadataIssues.missingCanonicals],
            ["Duplicate Titles", dashboard.metadataIssues.duplicateTitles],
            [
              "Duplicate Meta Descriptions",
              dashboard.metadataIssues.duplicateMetaDescriptions,
            ],
            ["Duplicate Content", dashboard.metadataIssues.duplicateContent],
          ]}
        />

        <IssueGroupCard
          icon={<ImageIcon className="h-5 w-5" />}
          eyebrow="image seo"
          title="Image SEO"
          rows={[
            ["Missing Alt Text", dashboard.imageSeo.missingAltText],
            ["Duplicate Alt Text", dashboard.imageSeo.duplicateAltText],
            ["Large Images", dashboard.imageSeo.largeImages],
            ["Unoptimized Images", dashboard.imageSeo.unoptimizedImages],
            ["Missing Titles", dashboard.imageSeo.missingTitles],
            ["Missing Captions", dashboard.imageSeo.missingCaptions],
          ]}
        />

        <IssueGroupCard
          icon={<BadgeCheck className="h-5 w-5" />}
          eyebrow="schema"
          title="Structured data"
          rows={[
            ["Missing Schema", dashboard.structuredData.missingSchema],
            ["Schema Errors", dashboard.structuredData.schemaErrors],
            [
              "Rich Result Eligibility",
              `${dashboard.structuredData.richResultEligibility}%`,
            ],
          ]}
        />

        <IssueGroupCard
          icon={<AlertTriangle className="h-5 w-5" />}
          eyebrow="technical seo"
          title="Technical SEO"
          rows={[
            ["Broken URLs", dashboard.technicalSeo.brokenUrls],
            ["Redirect Errors", dashboard.technicalSeo.redirectErrors],
            ["Orphan Pages", dashboard.technicalSeo.orphanPages],
            ["Sitemap Errors", dashboard.technicalSeo.sitemapErrors],
            ["Robots Issues", dashboard.technicalSeo.robotsIssues],
          ]}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<BarChart3 className="h-5 w-5" />}
            eyebrow="organic performance"
            title="Top landing pages"
          />

          <PageRevenueList
            emptyText="No top landing pages found."
            rows={dashboard.organicPerformance.topLandingPages}
            mode="sessions"
          />
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<BarChart3 className="h-5 w-5" />}
            eyebrow="organic performance"
            title="Top converting pages"
          />

          <PageRevenueList
            emptyText="No top converting pages found."
            rows={dashboard.organicPerformance.topConvertingPages}
            mode="conversion"
          />
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<BarChart3 className="h-5 w-5" />}
            eyebrow="organic performance"
            title="Highest revenue pages"
          />

          <PageRevenueList
            emptyText="No highest revenue pages found."
            rows={dashboard.organicPerformance.highestRevenuePages}
            mode="revenue"
          />
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<BarChart3 className="h-5 w-5" />}
            eyebrow="organic performance"
            title="Conversion rate by landing page"
          />

          <ConversionRateList
            rows={dashboard.organicPerformance.conversionRateByLandingPage}
          />
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <IssueGroupCard
          icon={<Sparkles className="h-5 w-5" />}
          eyebrow="content opportunities"
          title="Content opportunities"
          rows={[
            [
              "Missing FAQ Schema",
              dashboard.contentOpportunities.missingFaqSchema,
            ],
            [
              "Missing Buying Guides",
              dashboard.contentOpportunities.missingBuyingGuides,
            ],
            [
              "Missing Internal Links",
              dashboard.contentOpportunities.missingInternalLinks,
            ],
            ["Thin Content Pages", dashboard.contentOpportunities.thinContentPages],
            ["AI Suggestions", dashboard.contentOpportunities.aiSuggestions],
          ]}
        />

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
          <SectionTitle
            icon={<Bot className="h-5 w-5" />}
            eyebrow="shahsi seo"
            title="SEO opportunities"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboard.opportunities.length ? (
              dashboard.opportunities.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#f7f2ea] p-4">
                  <p className="font-medium text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-500">
                    {item.area}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.description}
                  </p>

                  {item.targetPath ? (
                    <Link
                      href={item.targetPath}
                      className="mt-3 inline-flex items-center text-sm font-medium text-neutral-950"
                    >
                      Open
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState text="No SEO opportunities found." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-5">
        <ShahsiWidgetCard
          title="Palette SEO"
          rows={[
            [
              "Top Palette Pages",
              dashboard.shahsiSpecificWidgets.paletteSeo.topPalettePages,
            ],
            [
              "Top Wedding Color Searches",
              dashboard.shahsiSpecificWidgets.paletteSeo.topWeddingColorSearches,
            ],
          ]}
        />

        <ShahsiWidgetCard
          title="Real Wedding SEO"
          rows={[
            [
              "Top Wedding Galleries",
              dashboard.shahsiSpecificWidgets.realWeddingSeo.topWeddingGalleries,
            ],
            [
              "Gallery Revenue",
              formatCurrency(
                dashboard.shahsiSpecificWidgets.realWeddingSeo
                  .weddingGalleryRevenueAttribution,
                dashboard.organicPerformance.currency,
              ),
            ],
          ]}
        />

        <ShahsiWidgetCard
          title="Swatch SEO"
          rows={[
            [
              "Most Viewed Swatch Pages",
              dashboard.shahsiSpecificWidgets.swatchSeo.mostViewedSwatchPages,
            ],
            [
              "Swatch To Order",
              `${dashboard.shahsiSpecificWidgets.swatchSeo.swatchToOrderConversion}%`,
            ],
          ]}
        />

        <ShahsiWidgetCard
          title="Rental SEO"
          rows={[
            [
              "Rental Landing Traffic",
              dashboard.shahsiSpecificWidgets.rentalSeo.rentalLandingTraffic,
            ],
            [
              "Rental Conversion",
              `${dashboard.shahsiSpecificWidgets.rentalSeo.rentalConversionRate}%`,
            ],
          ]}
        />

        <ShahsiWidgetCard
          title="MTO SEO"
          rows={[
            [
              "MTO Landing Traffic",
              dashboard.shahsiSpecificWidgets.mtoSeo.madeToOrderLandingTraffic,
            ],
            [
              "Custom Length Traffic",
              dashboard.shahsiSpecificWidgets.mtoSeo.customLengthTraffic,
            ],
            [
              "Rush Production Traffic",
              dashboard.shahsiSpecificWidgets.mtoSeo.rushProductionTraffic,
            ],
          ]}
        />
      </section>
    </main>
  );
}

function MetricCard({
  label,
  metric,
}: {
  label: string;
  metric: SeoMetric | SeoRevenueMetric;
}) {
  const value =
    "currency" in metric
      ? formatCurrency(metric.value, metric.currency)
      : formatNumber(metric.value);

  return (
    <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        {metric.status === "GOOD" ? (
          <BadgeCheck className="h-5 w-5 text-emerald-700" />
        ) : (
          <AlertTriangle
            className={`h-5 w-5 ${
              metric.status === "CRITICAL" ? "text-red-700" : "text-amber-700"
            }`}
          />
        )}

        <StatusBadge status={metric.status} />
      </div>

      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>

      <h2 className="mt-3 text-3xl font-medium tracking-tight">{value}</h2>

      <p className="mt-2 text-sm leading-5 text-neutral-500">{metric.note}</p>
    </Card>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        {icon}
        <p className="text-xs uppercase tracking-[0.18em]">{eyebrow}</p>
      </div>

      <h2 className="text-2xl font-medium">{title}</h2>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f2ea] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium">{formatNumber(value)}</p>
      <p className="text-xs text-neutral-500">{suffix}</p>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-950">{label}</span>
        <span className="text-neutral-500">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-950"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

function IssueGroupCard({
  icon,
  eyebrow,
  title,
  rows,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  rows: Array<[string, number | string]>;
}) {
  return (
    <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-6">
      <SectionTitle icon={icon} eyebrow={eyebrow} title={title} />

      <div className="mt-5 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl bg-[#f7f2ea] p-4"
          >
            <span className="text-sm font-medium text-neutral-950">{label}</span>
            <span className="text-sm font-semibold text-neutral-950">
              {typeof value === "number" ? formatNumber(value) : value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PageRevenueList({
  rows,
  emptyText,
  mode,
}: {
  rows: SeoPageRevenueRow[];
  emptyText: string;
  mode: "sessions" | "conversion" | "revenue";
}) {
  if (!rows.length) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="mt-5 space-y-3">
      {rows.map((row) => (
        <div
          key={row.url}
          className="grid gap-3 rounded-2xl border border-neutral-200 p-4 md:grid-cols-[1fr_auto_auto]"
        >
          <p className="break-all text-sm font-medium text-neutral-950">
            {row.url}
          </p>

          <p className="text-sm text-neutral-500">
            {mode === "sessions"
              ? `${formatNumber(row.sessions || 0)} sessions`
              : mode === "conversion"
                ? `${row.conversionRate || 0}% conversion`
                : "Revenue"}
          </p>

          <p className="text-sm font-semibold">
            {formatCurrency(row.revenue, row.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ConversionRateList({ rows }: { rows: SeoConversionRateRow[] }) {
  if (!rows.length) {
    return <EmptyState text="No conversion rate data found." />;
  }

  return (
    <div className="mt-5 space-y-3">
      {rows.map((row) => (
        <div
          key={row.url}
          className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-4"
        >
          <p className="break-all text-sm font-medium text-neutral-950">
            {row.url}
          </p>

          <p className="text-sm font-semibold">{row.conversionRate}%</p>
        </div>
      ))}
    </div>
  );
}

function ShahsiWidgetCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number | string]>;
}) {
  return (
    <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-neutral-500">
        <Link2 className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.16em]">Shahsi Widget</p>
      </div>

      <h3 className="text-lg font-medium text-neutral-950">{title}</h3>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 font-semibold text-neutral-950">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: SeoMetricStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        status === "GOOD"
          ? "bg-emerald-50 text-emerald-700"
          : status === "WARNING"
            ? "bg-amber-50 text-amber-700"
            : "bg-red-50 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-[#f7f2ea] p-4">
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}