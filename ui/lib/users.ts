import { z } from 'zod';
export const User = z.object({
  username: z.string(),
  age: z.number(),
});
export type User = z.infer<typeof User>;

export const GetUsersResponse = z.array(User);
export type GetUsersResponse = z.infer<typeof GetUsersResponse>;
