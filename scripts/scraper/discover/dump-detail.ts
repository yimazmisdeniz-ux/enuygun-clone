/** Dump real values from a hotel detail page for field mapping. */
import { BASE, PRICE_WINDOW, paths } from "../config.js";
import { fetchText } from "../lib/http.js";
import { extractNextData } from "../lib/nextdata.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

async function main() {
  const url = `${BASE}/otel/detay/concorde-luxury-resort-578301/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}`;
  const html = await fetchText(url);
  const nd = extractNextData(html);
  const di = nd?.props?.pageProps?.data?.detailInfo;
  const details = di?.hotel?.details ?? {};
  const rooms = di?.hotel?.rooms ?? [];
  const reviews = di?.hotelReviewsResult ?? {};
  const poi = di?.poi ?? {};

  writeJson(path.join(paths.data, "dump-detail-values.json"), {
    detailsKeys: Object.keys(details),
    details_id: details.id,
    name: details.name,
    slug: details.slug,
    starRating: details.starRating,
    reviewScore: details.reviewScore,
    reviewScoreLocalized: details.reviewScoreLocalized,
    reviewsTotalCount: details.reviewsTotalCount,
    commentCount: details.commentCount,
    reviewsAverage: details.reviewsAverage,
    coordinate: details.coordinate,
    address: details.address,
    cityCenterPointDistance: details.cityCenterPointDistance,
    cityCenterPointRegionName: details.cityCenterPointRegionName,
    description_first200: String(details.description ?? "").slice(0, 200),
    facilities_sample: details.facilities,
    popularFacilities_sample: details.popularFacilities,
    suitabilities_sample: details.suitabilities,
    images_sample: Array.isArray(details.images) ? details.images.slice(0, 3) : details.images,
    images_count: Array.isArray(details.images) ? details.images.length : null,
    locationDistance: details.locationDistance,
    region: di?.region,
    district: di?.district,
    roomsCount: rooms.length,
    room0: rooms[0],
    reviewsTotalCount2: reviews.totalCount,
    reviewsArrLen: Array.isArray(reviews.reviews) ? reviews.reviews.length : null,
    review0: Array.isArray(reviews.reviews) ? reviews.reviews[0] : null,
    poiKeys: Object.keys(poi),
    poi_airports: poi.AirPorts,
  });
  console.log("→ dump-detail-values.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
