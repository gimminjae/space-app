import { profileSchema } from '@/lib/profile';
import { assertOrigin, errorResponse, HttpError, readJson, requireUser } from '@/lib/server/auth';
import { userDb } from '@/lib/server/session';

export async function PATCH(request: Request) {
  try {
    assertOrigin(request);
    await requireUser();
    const input = profileSchema.safeParse(await readJson(request));
    if (!input.success) throw new HttpError(400, '닉네임은 1~60자로 입력해 주세요.');
    const { error } = await (await userDb()).auth.updateUser({ data: { display_name: input.data.displayName } });
    if (error) throw new HttpError(error.status === 429 ? 429 : 400, '프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return Response.json({ displayName: input.data.displayName }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
