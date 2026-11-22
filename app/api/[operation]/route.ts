import { NextRequest, NextResponse } from "next/server";
import { cookieName, cookieOptions, login, logout, register, saveFullRights } from "@/lib/store";

function error(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ operation: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin && origin !== `${request.nextUrl.protocol}//${request.headers.get("host")}`) {
    return error("Запрос с другого сайта отклонён.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return error("Ожидается JSON.", 415);
  }
  const data = await request.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return error("Проверьте данные формы.", 400);
  const { operation } = await context.params;
  const currentToken = request.cookies.get(cookieName)?.value;
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  let token: string;
  switch (operation) {
    case "register": {
      const result = await register(data);
      if ("errors" in result) return NextResponse.json({ errors: result.errors }, { status: 422 });
      token = result.token;
      break;
    }
    case "login": {
      const result = await login(data);
      if (!result) return error("Проверьте имя пользователя или почту и пароль.", 401);
      token = result;
      break;
    }
    case "logout":
      if (currentToken) await logout(currentToken);
      response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
      return response;
    case "settings": {
      if (!currentToken) return error("Войдите в аккаунт.", 401);
      if (typeof data.grantFullRights !== "boolean") return error("Некорректное значение настройки.", 400);
      if (!await saveFullRights(currentToken, data.grantFullRights)) return error("Доступно только администраторам.", 403);
      return response;
    }
    default:
      return error("Страница не найдена.", 404);
  }
  response.cookies.set(cookieName, token, cookieOptions);
  return response;
}
