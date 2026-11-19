// src/env.ts
export type CashierLinks = {
  gym: string;
  carWash: string;
  cafe: string;
  badminton: string;
  gaming: string;
  salon: string;
};

export const getEnv = () => {
  const env = (window as any).env;
  return {
    API_URL: env?.API_URL ?? "",
    COUPON_CODE_ID: env?.COUPON_CODE_ID ?? "",
    BADMINTON_OFFER_START_DATE: env?.BADMINTON_OFFER_START_DATE ?? "",
    BADMINTON_OFFER_DAYS: Number(env?.BADMINTON_OFFER_DAYS ?? 0),
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
