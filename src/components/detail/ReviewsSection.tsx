import {
  Star,
  Sparkles,
  Info,
  ChevronDown,
  Search,
  BedDouble,
  Calendar,
  Users,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import type { CategoryScore, Review } from "@/lib/data";
import { getTranslations } from "next-intl/server";

function StarRating({ value }: { value: number }) {
  const stars = value / 2; // 10 -> 5
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, stars - i));
        return (
          <span key={i} className="relative inline-block h-5 w-5">
            <Star className="absolute inset-0 h-5 w-5 text-star/40" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-5 w-5 fill-star text-star" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function CategoryBar({ item }: { item: CategoryScore }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-foreground">{item.label}</span>
        <span className="font-semibold text-foreground">
          {item.score.toFixed(1)}/10
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${item.score * 10}%` }}
        />
      </div>
    </div>
  );
}

function ReviewItem({
  review,
  reviewDateLabel,
}: {
  review: Review;
  reviewDateLabel: string;
}) {
  return (
    <div className="border-t border-border py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ede9fe] text-[12px] font-bold text-[#6d28d9]">
            {review.initials}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">{review.name}</p>
            <p className="text-[12px] text-muted-foreground">
              {reviewDateLabel} {review.date}
            </p>
          </div>
        </div>
        <span className="flex h-8 min-w-[34px] items-center justify-center rounded-md bg-brand-ink px-1.5 text-sm font-bold text-white">
          {review.rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="max-w-2xl text-[14px] leading-relaxed text-foreground">
          {review.text}
        </p>
        <div className="flex shrink-0 flex-col gap-1.5 rounded-lg border border-border p-3 text-[13px] text-foreground md:w-[230px]">
          <span className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            {review.room}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {review.stay}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {review.guestType}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function ReviewsSection({
  rating,
  ratingLabel,
  reviewCount,
  categoryScores,
  aiLikes,
  reviews,
}: {
  rating: number;
  ratingLabel: string;
  reviewCount: number;
  categoryScores: CategoryScore[];
  aiLikes: string[];
  reviews: Review[];
}) {
  const t = await getTranslations("Detail");
  return (
    <section id="yorumlar" className="scroll-mt-20">
      <Container className="py-7">
        <div className="rounded-2xl bg-surface p-5 md:p-7">
          <h2 className="text-[22px] font-bold text-foreground">
            {t("reviews.title")}
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
            {/* Score panel */}
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[44px] font-bold leading-none text-foreground">
                  {rating.toFixed(1)}
                </span>
                <span className="pb-1 text-lg font-bold text-foreground">
                  {ratingLabel}
                </span>
              </div>
              <div className="mt-2">
                <StarRating value={rating} />
              </div>
              <button className="mt-2 flex items-center gap-1 text-left text-[12px] font-semibold text-[#1a7ad9] hover:underline">
                {t("reviews.verifiedNote")}
                <Info className="h-3.5 w-3.5 shrink-0" />
              </button>

              <div className="mt-5 flex flex-col gap-4">
                {categoryScores.map((c) => (
                  <CategoryBar key={c.label} item={c} />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              {/* Filter row */}
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold text-foreground">
                  {t("reviews.evaluationCount", { count: reviewCount })}
                </p>
                <button className="flex items-center gap-1 text-sm text-foreground">
                  {t("reviews.sortBy")}{" "}
                  <span className="font-semibold">{t("reviews.mostRelevant")}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <div className="relative md:w-[280px]">
                  <span className="pointer-events-none absolute left-3 top-1 text-[11px] font-semibold text-muted-foreground">
                    {t("reviews.guestType")}
                  </span>
                  <button className="flex w-full items-center justify-between rounded-md border border-border px-3 pb-2 pt-5 text-sm font-semibold text-foreground">
                    {t("reviews.all")}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder={t("reviews.searchPlaceholder")}
                    className="w-full rounded-md border border-border py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
                  />
                </div>
              </div>

              {/* AI summary */}
              <div className="mt-4 rounded-xl border border-[#bcd9f5] bg-[#eef6fe] p-4">
                <p className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                  <Sparkles className="h-5 w-5 text-[#1a7ad9]" />
                  {t("reviews.aiTitle")}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t("reviews.aiSubtitle")}
                </p>
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14px] text-foreground">
                  {aiLikes.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  {t("reviews.aiDisclaimer")}
                </p>
              </div>

              {/* Review list */}
              <div className="mt-2">
                {reviews.map((r, i) => (
                  <ReviewItem
                    key={i}
                    review={r}
                    reviewDateLabel={t("reviews.reviewDate")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
