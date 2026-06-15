"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { PaymentLogos } from "@/components/booking/PaymentLogos";

const INSTALLMENTS = [1, 2, 3, 6, 9];

export function InstallmentModal({
  open,
  onClose,
  priceTL,
}: {
  open: boolean;
  onClose: () => void;
  priceTL: number;
}) {
  const t = useTranslations("Booking");
  const money = useMoney();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("payment.installmentTableTitle")}
    >
      <p className="text-[13px] text-muted-foreground">
        {t("payment.installmentTableNote")}
      </p>
      <PaymentLogos className="mt-3" />
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">{t("payment.installment")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("payment.monthlyAmount")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("payment.totalAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {INSTALLMENTS.map((n) => (
              <tr key={n} className="border-t border-border">
                <td className="px-4 py-2.5 font-semibold text-foreground">
                  {n === 1
                    ? t("payment.singlePayment")
                    : t("payment.nInstallments", { n })}
                </td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {money.format(priceTL / n, 2)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                  {money.format(priceTL, 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}