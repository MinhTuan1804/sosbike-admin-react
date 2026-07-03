import { z } from "zod";

const feeRateSchema = z
  .number()
  .min(0, "Giá trị tối thiểu là 0%.")
  .max(100, "Giá trị tối đa là 100%.")
  .refine((value) => Number.isFinite(value), "Giá trị không hợp lệ.")
  .refine((value) => Math.round(value * 100) === value * 100, "Chỉ tối đa 2 chữ số thập phân.")
  .default(10);

const urlOrEmptySchema = z
  .string()
  .trim()
  .max(500, "URL quá dài.")
  .refine((value) => {
    if (value === "") return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL không hợp lệ.")
  .default("");

const brandNameSchema = z
  .string()
  .trim()
  .min(2, "Brand name tối thiểu 2 ký tự.")
  .max(50, "Brand name tối đa 50 ký tự.")
  .default("SOSBIKE");

const featureFlagsSchema = z
  .object({
    maintenanceMode: z.boolean().default(false),
    sosEnabled: z.boolean().default(true),
    customerRegisterEnabled: z.boolean().default(true),
    mechanicRegisterEnabled: z.boolean().default(true)
  })
  .default({
    maintenanceMode: false,
    sosEnabled: true,
    customerRegisterEnabled: true,
    mechanicRegisterEnabled: true
  });
const hexColorSchema = (defaultValue: string) => z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Màu sắc không hợp lệ. Phải là mã HEX (VD: #DA251D)")
  .default(defaultValue);

const thirdPartySchema = z
  .object({
    goongApiKey: z.string().trim().default("J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq"),
    googleMapApiKey: z.string().trim().default(""),
    payOsClientId: z.string().trim().default(""),
    payOsApiKey: z.string().trim().default(""),
    payOsChecksumKey: z.string().trim().default(""),
    resendApiKey: z.string().trim().default(""),
    resendFromEmail: z.string().trim().default(""),
    resendFromName: z.string().trim().default(""),
    esmsApiKey: z.string().trim().default(""),
    esmsSecretKey: z.string().trim().default(""),
    esmsBrandName: z.string().trim().default("")
  })
  .default({
    goongApiKey: "J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq",
    googleMapApiKey: "",
    payOsClientId: "",
    payOsApiKey: "",
    payOsChecksumKey: "",
    resendApiKey: "",
    resendFromEmail: "",
    resendFromName: "",
    esmsApiKey: "",
    esmsSecretKey: "",
    esmsBrandName: ""
  });

const landingPageSchema = z
  .object({
    hotline: z.string().trim().default("0982815244"),
    facebookUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222"),
    appStoreUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222"),
    googlePlayUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222"),
    backgroundImageUrl: urlOrEmptySchema.default(""),
    primaryColor: hexColorSchema("#DA251D"),
    secondaryColor: hexColorSchema("#3B82F6")
  })
  .default({
    hotline: "0982815244",
    facebookUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    appStoreUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    googlePlayUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    backgroundImageUrl: "",
    primaryColor: "#DA251D",
    secondaryColor: "#3B82F6"
  });

const rescueSchema = z
  .object({
    matchingRadiusKm: z.number().min(0.1, "Bán kính tối thiểu 0.1km.").default(30),
    pendingTimeoutMinutes: z.number().int().min(1, "Thời gian chờ tối thiểu 1 phút.").default(5),
    acceptedReminderMinutes: z.number().int().min(1, "Thời gian nhắc nhở tối thiểu 1 phút.").default(30),
    acceptedTimeoutMinutes: z.number().int().min(1, "Thời gian chờ tối đa tối thiểu 1 phút.").default(45),
    arrivedReminderMinutes: z.number().int().min(1, "Thời gian nhắc nhở tối thiểu 1 phút.").default(30),
    arrivedAlertAdminMinutes: z.number().int().min(1, "Thời gian cảnh báo tối thiểu 1 phút.").default(60),
    quotingReminderMinutes: z.number().int().min(1, "Thời gian nhắc nhở tối thiểu 1 phút.").default(15),
    quotingTimeoutMinutes: z.number().int().min(1, "Thời gian chờ tối đa tối thiểu 1 phút.").default(30),
    repairingAlertAdminMinutes: z.number().int().min(1, "Thời gian cảnh báo tối thiểu 1 phút.").default(180)
  })
  .default({
    matchingRadiusKm: 30,
    pendingTimeoutMinutes: 5,
    acceptedReminderMinutes: 30,
    acceptedTimeoutMinutes: 45,
    arrivedReminderMinutes: 30,
    arrivedAlertAdminMinutes: 60,
    quotingReminderMinutes: 15,
    quotingTimeoutMinutes: 30,
    repairingAlertAdminMinutes: 180
  });

const activityLogSchema = z
  .object({
    backupEnabled: z.boolean().default(true),
    backupIntervalDays: z.number().int().min(1, "Chu kỳ tối thiểu 1 ngày.").default(14),
    checkIntervalHours: z.number().int().min(1, "Chu kỳ tối thiểu 1 giờ.").default(24)
  })
  .default({
    backupEnabled: true,
    backupIntervalDays: 14,
    checkIntervalHours: 24
  });

const walletSchema = z
  .object({
    minWithdrawAmount: z.number().min(0, "Số tiền tối thiểu là 0đ.").default(50000),
    maxDailyWithdrawAmount: z.number().min(0, "Số tiền tối đa là 0đ.").default(5000000)
  })
  .default({
    minWithdrawAmount: 50000,
    maxDailyWithdrawAmount: 5000000
  });

const nightSurchargeSchema = z
  .object({
    nightSurchargeEnabled: z.boolean().default(true),
    nightStartHour: z.number().int().min(0).max(23, "Giờ phải từ 0 đến 23.").default(22),
    nightEndHour: z.number().int().min(0).max(23, "Giờ phải từ 0 đến 23.").default(5),
    nightSurchargeFee: z.number().min(0, "Số tiền phụ thu tối thiểu là 0đ.").default(25000)
  })
  .default({
    nightSurchargeEnabled: true,
    nightStartHour: 22,
    nightEndHour: 5,
    nightSurchargeFee: 25000
  });

export const AppConfigSchema = z
  .object({
    platform: z.object({
      defaultPlatformFeeRate: feeRateSchema,
      mechanicCommissionDefault: feeRateSchema.default(15)
    }),
    ui: z.object({
      homeBackgroundUrl: urlOrEmptySchema,
      brandName: brandNameSchema,
      appBackgroundColor: hexColorSchema("#FFFFFF"),
      appNavbarBottomColor: hexColorSchema("#D02121"),
      appNavbarHeaderColor: hexColorSchema("#D02121")
    }),
    featureFlags: featureFlagsSchema,
    thirdParty: thirdPartySchema,
    landingPage: landingPageSchema,
    rescue: rescueSchema,
    activityLog: activityLogSchema,
    wallet: walletSchema,
    nightSurcharge: nightSurchargeSchema
  })
  .superRefine((value, ctx) => {
    const total = value.platform.defaultPlatformFeeRate + value.platform.mechanicCommissionDefault;
    if (total > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tổng platform fee + commission phải ≤ 100%.",
        path: ["platform", "defaultPlatformFeeRate"]
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tổng platform fee + commission phải ≤ 100%.",
        path: ["platform", "mechanicCommissionDefault"]
      });
    }
  });

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const defaultConfig: AppConfig = AppConfigSchema.parse({
  platform: { defaultPlatformFeeRate: 10, mechanicCommissionDefault: 15 },
  ui: {
    homeBackgroundUrl: "",
    brandName: "SOSBIKE",
    appBackgroundColor: "#FFFFFF",
    appNavbarBottomColor: "#D02121",
    appNavbarHeaderColor: "#D02121"
  },
  featureFlags: {
    maintenanceMode: false,
    sosEnabled: true,
    customerRegisterEnabled: true,
    mechanicRegisterEnabled: true
  },
  thirdParty: {
    goongApiKey: "J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq",
    googleMapApiKey: "",
    payOsClientId: "",
    payOsApiKey: "",
    payOsChecksumKey: "",
    resendApiKey: "",
    resendFromEmail: "",
    resendFromName: "",
    esmsApiKey: "",
    esmsSecretKey: "",
    esmsBrandName: ""
  },
  landingPage: {
    hotline: "0982815244",
    facebookUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    appStoreUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    googlePlayUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    backgroundImageUrl: "",
    primaryColor: "#DA251D",
    secondaryColor: "#3B82F6"
  },
  rescue: {
    matchingRadiusKm: 30,
    pendingTimeoutMinutes: 5,
    acceptedReminderMinutes: 30,
    acceptedTimeoutMinutes: 45,
    arrivedReminderMinutes: 30,
    arrivedAlertAdminMinutes: 60,
    quotingReminderMinutes: 15,
    quotingTimeoutMinutes: 30,
    repairingAlertAdminMinutes: 180
  },
  activityLog: {
    backupEnabled: true,
    backupIntervalDays: 14,
    checkIntervalHours: 24
  },
  wallet: {
    minWithdrawAmount: 50000,
    maxDailyWithdrawAmount: 5000000
  },
  nightSurcharge: {
    nightSurchargeEnabled: true,
    nightStartHour: 22,
    nightEndHour: 5,
    nightSurchargeFee: 25000
  }
});
