import { z } from "zod";
import { http } from "../../shared/http";

const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  accessTokenExpiry: z.string().optional(),
  user: z
    .object({
      userID: z.string(),
      fullName: z.string(),
      phoneNumber: z.string(),
      userType: z.string(),
    })
    .optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export async function loginWithPassword(phoneNumber: string, password: string) {
  const resp = await http.post("/Auth/login", { phoneNumber, password });
  return LoginResponseSchema.parse(resp.data);
}
