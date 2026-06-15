/**
 * Static legal page content (Privacy, Cookies, Terms, Security).
 * Keyed by locale so the pages render in the active language. Body copy lives
 * here rather than in messages.json to keep long-form prose out of the ICU
 * message catalogue.
 */

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type LegalDoc = {
  slug: string;
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
};

export type LegalKey = "privacy" | "cookies" | "terms" | "security";

type Locale = "tr" | "en";

const COMPANY = "BOOKERA";
const EMAIL = "destek@bookera.com";
const PHONE = "0850 811 90 90";

/** Long-form "last updated" date, derived from the build date constant. */
const UPDATED = {
  tr: "14 Haziran 2026",
  en: "14 June 2026",
};

const tr: Record<LegalKey, LegalDoc> = {
  privacy: {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    updatedLabel: `Son güncelleme: ${UPDATED.tr}`,
    intro: `${COMPANY} olarak kişisel verilerinizin gizliliğine önem veriyoruz. Bu Gizlilik Politikası, platformumuzu kullanırken hangi verileri topladığımızı, bu verileri nasıl işlediğimizi ve haklarınızı açıklar.`,
    sections: [
      {
        heading: "1. Topladığımız Veriler",
        paragraphs: [
          "Hizmetlerimizden yararlanırken aşağıdaki kişisel verileri toplayabiliriz:",
        ],
        list: [
          "Ad, soyad, e-posta adresi ve telefon numarası gibi kimlik ve iletişim bilgileri",
          "Otel ve araç kiralama rezervasyonlarına ilişkin bilgiler",
          "Ödeme işlemleri için gerekli fatura ve kart bilgileri (kart verileri tarafımızca saklanmaz)",
          "IP adresi, cihaz ve tarayıcı bilgileri ile site kullanım verileri",
        ],
      },
      {
        heading: "2. Verilerin İşlenme Amaçları",
        paragraphs: ["Kişisel verilerinizi yalnızca aşağıdaki amaçlarla işliyoruz:"],
        list: [
          "Rezervasyon ve ödeme işlemlerinizi gerçekleştirmek",
          "Müşteri destek hizmeti sunmak ve taleplerinizi yanıtlamak",
          "Yasal yükümlülüklerimizi yerine getirmek",
          "Hizmet kalitemizi geliştirmek ve size uygun teklifler sunmak",
        ],
      },
      {
        heading: "3. Verilerin Paylaşımı",
        paragraphs: [
          "Kişisel verileriniz; rezervasyonunuzu tamamlamak için ilgili otel, araç kiralama firması ve ödeme kuruluşları ile yasal sınırlar dahilinde paylaşılır. Verileriniz pazarlama amacıyla üçüncü taraflara satılmaz.",
        ],
      },
      {
        heading: "4. KVKK Kapsamındaki Haklarınız",
        paragraphs: [
          "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme ve işlemeye itiraz etme haklarına sahipsiniz.",
        ],
      },
      {
        heading: "5. Veri Güvenliği ve Saklama",
        paragraphs: [
          "Verileriniz SSL şifreleme ve erişim kontrolleri ile korunur. Kişisel verileriniz, işleme amacının gerektirdiği ve yasal saklama sürelerinin öngördüğü süre boyunca saklanır.",
        ],
      },
      {
        heading: "6. İletişim",
        paragraphs: [
          `Gizlilik ile ilgili her türlü talebiniz için ${EMAIL} adresinden veya ${PHONE} numaralı çağrı merkezimizden bize ulaşabilirsiniz.`,
        ],
      },
    ],
  },
  cookies: {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    updatedLabel: `Son güncelleme: ${UPDATED.tr}`,
    intro: `Bu Çerez Politikası, ${COMPANY} platformunda çerezlerin nasıl ve hangi amaçlarla kullanıldığını açıklar.`,
    sections: [
      {
        heading: "1. Çerez Nedir?",
        paragraphs: [
          "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Çerezler sayesinde site tercihlerinizi hatırlar ve size daha iyi bir deneyim sunarız.",
        ],
      },
      {
        heading: "2. Kullandığımız Çerez Türleri",
        list: [
          "Zorunlu çerezler: Sitenin temel işlevleri ve güvenliği için gereklidir.",
          "Performans çerezleri: Sitenin nasıl kullanıldığını anlamamıza yardımcı olur.",
          "İşlevsel çerezler: Dil ve para birimi gibi tercihlerinizi hatırlar.",
          "Pazarlama çerezleri: Size uygun reklam ve teklifler göstermek için kullanılır.",
        ],
      },
      {
        heading: "3. Çerezleri Yönetme",
        paragraphs: [
          "Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin devre dışı bırakılması durumunda sitenin bazı bölümleri düzgün çalışmayabilir.",
        ],
      },
      {
        heading: "4. Üçüncü Taraf Çerezleri",
        paragraphs: [
          "Analitik ve ödeme hizmetleri gibi bazı işlevler için güvenilir üçüncü taraf sağlayıcıların çerezleri kullanılabilir. Bu çerezler ilgili sağlayıcıların gizlilik politikalarına tabidir.",
        ],
      },
      {
        heading: "5. İletişim",
        paragraphs: [
          `Çerez kullanımı hakkında sorularınız için ${EMAIL} adresinden bize ulaşabilirsiniz.`,
        ],
      },
    ],
  },
  terms: {
    slug: "kullanim-sartlari",
    title: "Kullanım Şartları",
    updatedLabel: `Son güncelleme: ${UPDATED.tr}`,
    intro: `${COMPANY} platformunu kullanarak aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Lütfen bu şartları dikkatlice okuyunuz.`,
    sections: [
      {
        heading: "1. Hizmetin Kapsamı",
        paragraphs: [
          `${COMPANY}, otel ve araç kiralama rezervasyonlarını karşılaştırma ve gerçekleştirme imkânı sunan bir aracılık platformudur. Hizmet sağlayıcılar ile son kullanıcı arasındaki sözleşme doğrudan ilgili tedarikçi ile kurulur.`,
        ],
      },
      {
        heading: "2. Üyelik ve Hesap Güvenliği",
        paragraphs: [
          "Hesabınıza ait kullanıcı adı ve şifrenin gizliliğinden siz sorumlusunuz. Hesabınız üzerinden gerçekleştirilen tüm işlemlerden kullanıcı sorumludur.",
        ],
      },
      {
        heading: "3. Rezervasyon ve Ödeme",
        paragraphs: [
          "Rezervasyon sırasında verdiğiniz bilgilerin doğru ve güncel olması gerekir. Fiyatlar ve müsaitlik anlık olarak değişebilir; ödeme tamamlanana kadar fiyat garanti edilmez.",
        ],
      },
      {
        heading: "4. İptal ve İade",
        paragraphs: [
          "İptal ve iade koşulları, rezervasyon yaptığınız otel veya araç kiralama firmasının politikalarına göre değişir. Ücretsiz iptal seçeneği yalnızca ilgili kayıtta belirtildiği durumlarda geçerlidir.",
        ],
      },
      {
        heading: "5. Sorumluluğun Sınırlandırılması",
        paragraphs: [
          `${COMPANY}, tedarikçiler tarafından sağlanan hizmetlerin kalitesinden doğrudan sorumlu değildir. Platform, hizmetin kesintisiz ve hatasız sunulacağını garanti etmez.`,
        ],
      },
      {
        heading: "6. Fikri Mülkiyet",
        paragraphs: [
          "Platformdaki tüm içerik, marka ve tasarımlar ilgili hak sahiplerine aittir ve izinsiz kullanılamaz.",
        ],
      },
      {
        heading: "7. Değişiklikler ve İletişim",
        paragraphs: [
          `Bu şartlar zaman zaman güncellenebilir. Sorularınız için ${PHONE} numaralı çağrı merkezimizle iletişime geçebilirsiniz.`,
        ],
      },
    ],
  },
  security: {
    slug: "guvenlik",
    title: "Güvenlik",
    updatedLabel: `Son güncelleme: ${UPDATED.tr}`,
    intro: `${COMPANY}, kullanıcılarının verilerini ve ödemelerini korumak için sektör standardı güvenlik önlemleri uygular.`,
    sections: [
      {
        heading: "1. Güvenli Ödeme",
        paragraphs: [
          "Tüm ödeme işlemleri 256-bit SSL şifreleme ile korunur. Kredi kartı işlemlerinizde 3D Secure doğrulaması kullanılır ve kart bilgileriniz sunucularımızda saklanmaz.",
        ],
      },
      {
        heading: "2. Veri Şifreleme",
        paragraphs: [
          "Platform ile tarayıcınız arasındaki tüm veri trafiği SSL/TLS protokolleri ile şifrelenir. Hassas verileriniz hem aktarım hem de saklama sırasında korunur.",
        ],
      },
      {
        heading: "3. Erişim Kontrolü",
        paragraphs: [
          "Kişisel verilere erişim yalnızca yetkili personelle sınırlıdır ve düzenli olarak denetlenir. Sistemlerimiz sürekli izlenir ve güncel tutulur.",
        ],
      },
      {
        heading: "4. Güvenli Hesap Önerileri",
        list: [
          "Güçlü ve benzersiz bir şifre kullanın.",
          "Şifrenizi kimseyle paylaşmayın.",
          "Şüpheli e-posta ve bağlantılara karşı dikkatli olun.",
          "Oturumunuzu ortak cihazlarda kapatmayı unutmayın.",
        ],
      },
      {
        heading: "5. Güvenlik Açığı Bildirimi",
        paragraphs: [
          `Bir güvenlik açığı tespit ettiğinizi düşünüyorsanız lütfen ${EMAIL} adresinden bizimle iletişime geçin. Bildirimlerinizi gizlilik içinde değerlendiriyoruz.`,
        ],
      },
    ],
  },
};

const en: Record<LegalKey, LegalDoc> = {
  privacy: {
    slug: "gizlilik-politikasi",
    title: "Privacy Policy",
    updatedLabel: `Last updated: ${UPDATED.en}`,
    intro: `At ${COMPANY}, we value the privacy of your personal data. This Privacy Policy explains what data we collect when you use our platform, how we process it, and your rights.`,
    sections: [
      {
        heading: "1. Data We Collect",
        paragraphs: ["We may collect the following personal data while you use our services:"],
        list: [
          "Identity and contact details such as name, surname, email address and phone number",
          "Information related to your hotel and car rental bookings",
          "Billing and card information required for payments (card data is not stored by us)",
          "IP address, device and browser information, and site usage data",
        ],
      },
      {
        heading: "2. Purposes of Processing",
        paragraphs: ["We process your personal data only for the following purposes:"],
        list: [
          "To complete your booking and payment transactions",
          "To provide customer support and respond to your requests",
          "To fulfil our legal obligations",
          "To improve our service quality and offer you relevant deals",
        ],
      },
      {
        heading: "3. Sharing of Data",
        paragraphs: [
          "Your personal data is shared, within legal limits, with the relevant hotel, car rental company and payment institutions to complete your booking. Your data is never sold to third parties for marketing purposes.",
        ],
      },
      {
        heading: "4. Your Rights",
        paragraphs: [
          "Under applicable data protection law, you have the right to learn whether your data is being processed, to request its correction or deletion, and to object to processing.",
        ],
      },
      {
        heading: "5. Data Security and Retention",
        paragraphs: [
          "Your data is protected with SSL encryption and access controls. Personal data is retained only for as long as the processing purpose requires and legal retention periods mandate.",
        ],
      },
      {
        heading: "6. Contact",
        paragraphs: [
          `For any privacy-related request, you can reach us at ${EMAIL} or via our call centre at ${PHONE}.`,
        ],
      },
    ],
  },
  cookies: {
    slug: "cerez-politikasi",
    title: "Cookie Policy",
    updatedLabel: `Last updated: ${UPDATED.en}`,
    intro: `This Cookie Policy explains how and for what purposes cookies are used on the ${COMPANY} platform.`,
    sections: [
      {
        heading: "1. What Is a Cookie?",
        paragraphs: [
          "Cookies are small text files stored in your browser by the websites you visit. Cookies allow us to remember your preferences and provide a better experience.",
        ],
      },
      {
        heading: "2. Types of Cookies We Use",
        list: [
          "Essential cookies: Required for core site functions and security.",
          "Performance cookies: Help us understand how the site is used.",
          "Functional cookies: Remember preferences such as language and currency.",
          "Marketing cookies: Used to show you relevant ads and offers.",
        ],
      },
      {
        heading: "3. Managing Cookies",
        paragraphs: [
          "You can delete or block cookies from your browser settings. If essential cookies are disabled, some parts of the site may not work properly.",
        ],
      },
      {
        heading: "4. Third-Party Cookies",
        paragraphs: [
          "Cookies from trusted third-party providers may be used for functions such as analytics and payments. These cookies are subject to the privacy policies of the relevant providers.",
        ],
      },
      {
        heading: "5. Contact",
        paragraphs: [`For questions about cookie usage, you can reach us at ${EMAIL}.`],
      },
    ],
  },
  terms: {
    slug: "kullanim-sartlari",
    title: "Terms of Use",
    updatedLabel: `Last updated: ${UPDATED.en}`,
    intro: `By using the ${COMPANY} platform, you agree to the following terms of use. Please read them carefully.`,
    sections: [
      {
        heading: "1. Scope of Service",
        paragraphs: [
          `${COMPANY} is an intermediary platform that lets you compare and make hotel and car rental bookings. The contract for the service is formed directly between you and the relevant supplier.`,
        ],
      },
      {
        heading: "2. Membership and Account Security",
        paragraphs: [
          "You are responsible for keeping your username and password confidential. The user is responsible for all transactions carried out through their account.",
        ],
      },
      {
        heading: "3. Booking and Payment",
        paragraphs: [
          "The information you provide during booking must be accurate and up to date. Prices and availability may change in real time; the price is not guaranteed until payment is completed.",
        ],
      },
      {
        heading: "4. Cancellation and Refund",
        paragraphs: [
          "Cancellation and refund conditions vary according to the policies of the hotel or car rental company you booked. The free cancellation option applies only when stated on the relevant listing.",
        ],
      },
      {
        heading: "5. Limitation of Liability",
        paragraphs: [
          `${COMPANY} is not directly responsible for the quality of services provided by suppliers. The platform does not guarantee uninterrupted or error-free service.`,
        ],
      },
      {
        heading: "6. Intellectual Property",
        paragraphs: [
          "All content, brands and designs on the platform belong to their respective owners and may not be used without permission.",
        ],
      },
      {
        heading: "7. Changes and Contact",
        paragraphs: [
          `These terms may be updated from time to time. For questions, you can contact our call centre at ${PHONE}.`,
        ],
      },
    ],
  },
  security: {
    slug: "guvenlik",
    title: "Security",
    updatedLabel: `Last updated: ${UPDATED.en}`,
    intro: `${COMPANY} applies industry-standard security measures to protect its users' data and payments.`,
    sections: [
      {
        heading: "1. Secure Payment",
        paragraphs: [
          "All payment transactions are protected with 256-bit SSL encryption. 3D Secure verification is used for your card transactions, and your card details are not stored on our servers.",
        ],
      },
      {
        heading: "2. Data Encryption",
        paragraphs: [
          "All data traffic between the platform and your browser is encrypted with SSL/TLS protocols. Your sensitive data is protected both in transit and at rest.",
        ],
      },
      {
        heading: "3. Access Control",
        paragraphs: [
          "Access to personal data is limited to authorised personnel only and is audited regularly. Our systems are continuously monitored and kept up to date.",
        ],
      },
      {
        heading: "4. Account Safety Tips",
        list: [
          "Use a strong and unique password.",
          "Do not share your password with anyone.",
          "Be cautious of suspicious emails and links.",
          "Remember to log out on shared devices.",
        ],
      },
      {
        heading: "5. Reporting a Vulnerability",
        paragraphs: [
          `If you believe you have found a security vulnerability, please contact us at ${EMAIL}. We review all reports confidentially.`,
        ],
      },
    ],
  },
};

const docs: Record<Locale, Record<LegalKey, LegalDoc>> = { tr, en };

/** Resolve a legal document for the given key + locale (defaults to Turkish). */
export function getLegalDoc(key: LegalKey, locale: string = "tr"): LegalDoc {
  const set = locale === "en" ? docs.en : docs.tr;
  return set[key];
}

/** Footer legal links — slug is locale-independent, label follows locale. */
export const legalFooterLinks: { key: LegalKey; slug: string }[] = [
  { key: "privacy", slug: "gizlilik-politikasi" },
  { key: "cookies", slug: "cerez-politikasi" },
  { key: "terms", slug: "kullanim-sartlari" },
  { key: "security", slug: "guvenlik" },
];
