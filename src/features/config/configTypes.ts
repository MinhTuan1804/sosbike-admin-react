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

const thirdPartySchema = z
  .object({
    goongApiKey: z.string().trim().default("J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq")
  })
  .default({
    goongApiKey: "J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq"
  });

const landingPageSchema = z
  .object({
    hotline: z.string().trim().default("0982815244"),
    facebookUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222"),
    appStoreUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222"),
    googlePlayUrl: urlOrEmptySchema.default("https://www.facebook.com/profile.php?id=61572062824222")
  })
  .default({
    hotline: "0982815244",
    facebookUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    appStoreUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    googlePlayUrl: "https://www.facebook.com/profile.php?id=61572062824222"
  });

export const AppConfigSchema = z
  .object({
    platform: z.object({
      defaultPlatformFeeRate: feeRateSchema,
      mechanicCommissionDefault: feeRateSchema.default(15)
    }),
    ui: z.object({
      homeBackgroundUrl: urlOrEmptySchema,
      brandName: brandNameSchema
    }),
    featureFlags: featureFlagsSchema,
    thirdParty: thirdPartySchema,
    landingPage: landingPageSchema
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
  ui: { homeBackgroundUrl: "", brandName: "SOSBIKE" },
  featureFlags: {
    maintenanceMode: false,
    sosEnabled: true,
    customerRegisterEnabled: true,
    mechanicRegisterEnabled: true
  },
  thirdParty: {
    goongApiKey: "J7uk8GJZvzozpZ8p631cnxMVXUNVz0O0juQCSAJq"
  },
  landingPage: {
    hotline: "0982815244",
    facebookUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    appStoreUrl: "https://www.facebook.com/profile.php?id=61572062824222",
    googlePlayUrl: "https://www.facebook.com/profile.php?id=61572062824222"
  }
});
