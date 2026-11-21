// src/env.ts
export type CashierLinks = {
  gym: string;
  carWash: string;
  cafe: string;
  badminton: string;
  gaming: string;
  salon: string;
};

type RuntimeEnv = {
  API_URL?: string;
  COUPON_CODE_ID?: string;
  BADMINTON_OFFER_START_DATE?: string;
  BADMINTON_OFFER_DAYS?: number | string;
  SMS_PRICE_LKR?: number | string;
  SMS_LENGTH?: number | string;
  SMS_MONTHLY_LIMIT?: number | string;
  SMS_MAX_SEGMENTS_PER_MESSAGE?: number | string;
  CASHIER_LINKS?: CashierLinks;
};

export const getEnv = () => {
  const env = (window as Window & { env?: RuntimeEnv }).env;
  return {
    API_URL: env?.API_URL ?? "",
    COUPON_CODE_ID: env?.COUPON_CODE_ID ?? "",
    BADMINTON_OFFER_START_DATE: env?.BADMINTON_OFFER_START_DATE ?? "",
    BADMINTON_OFFER_DAYS: Number(env?.BADMINTON_OFFER_DAYS ?? 0),
    SMS_PRICE_LKR: Number(env?.SMS_PRICE_LKR ?? 0.59),
    SMS_LENGTH: Number(env?.SMS_LENGTH ?? 160),
    SMS_MONTHLY_LIMIT: Number(env?.SMS_MONTHLY_LIMIT ?? 0),
    SMS_MAX_SEGMENTS_PER_MESSAGE: Number(env?.SMS_MAX_SEGMENTS_PER_MESSAGE ?? 5),
    CASHIER_LINKS: (env?.CASHIER_LINKS ?? {
      gym: "",
      carWash: "",
      cafe: "",
      badminton: "",
      gaming: "",
      salon: "",
    }) as CashierLinks,
  };
};
