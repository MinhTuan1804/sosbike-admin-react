import { z } from "zod";

export const AppConfigSchema = z.object({
  platform: z.object({
    defaultPlatformFeeRate: z.number().min(0).max(100).default(10),
    mechanicCommissionDefault: z.number().min(0).max(100).default(15)
  }),
  ui: z.object({
    homeBackgroundUrl: z.string().url().or(z.literal("")).default(""),
    brandName: z.string().min(1).default("SOSBIKE")
  })
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const defaultConfig: AppConfig = AppConfigSchema.parse({
  platform: { defaultPlatformFeeRate: 10, mechanicCommissionDefault: 15 },
  ui: { homeBackgroundUrl: "", brandName: "SOSBIKE" }
});

