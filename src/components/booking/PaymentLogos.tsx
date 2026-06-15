import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGOS = [
  { src: "/images/payment/bkm-express.svg", alt: "BKM Express", w: 54 },
  { src: "/images/payment/troy.svg", alt: "Troy", w: 40 },
  { src: "/images/payment/visa.svg", alt: "Visa", w: 40 },
  { src: "/images/payment/mastercard.svg", alt: "Mastercard", w: 34 },
  { src: "/images/payment/maximum.svg", alt: "Maximum", w: 38 },
  { src: "/images/payment/axess.svg", alt: "Axess", w: 40 },
] as const;

export function PaymentLogos({
  className,
  withSecure = false,
}: {
  className?: string;
  withSecure?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {LOGOS.map((l) => (
        <Image
          key={l.src}
          src={l.src}
          alt={l.alt}
          width={l.w}
          height={24}
          className="h-6 w-auto opacity-90"
        />
      ))}
      {withSecure && (
        <Image
          src="/images/payment/3d-secure.svg"
          alt="3D Secure"
          width={44}
          height={24}
          className="h-6 w-auto opacity-90"
        />
      )}
    </div>
  );
}
