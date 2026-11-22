import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

import { SessionRepository } from "../../db/repositories/sessions"
import { createOpaqueSecret, hashSecret } from "../../http/credentials"
import type { AppEnv } from "../../types"

export const SESSION_COOKIE_NAME = "bodylog_session"

const DAY_MS = 24 * 60 * 60 * 1000
const SESSION_TTL_MS = 30 * DAY_MS
const SESSION_RENEW_WINDOW_MS = 7 * DAY_MS
const SESSION_MAX_LIFETIME_MS = 180 * DAY_MS

/** Cookie attributes shared by every BodyLog cookie; `Secure` is dropped on localhost so plain-http dev works. */
export function getCookieSecurityOptions(requestUrl: string) {
  const { hostname } = new URL(requestUrl)
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

  return {
    httpOnly: true,
    sameSite: "Lax",
    secure: !isLocalhost,
  } as const
}

function setSessionCookie(
  c: Context<AppEnv>,
  sessionId: string,
  expiresAt: Date,
  now: Date,
) {
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    ...getCookieSecurityOptions(c.req.url),
    maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    path: "/",
  })
}

/** Creates a session for the user and sets its cookie, ending the one the browser already had; each sign-in also sweeps expired sessions, so no cron is needed. */
export async function startSession(c: Context<AppEnv>, userId: string) {
  const now = new Date()
  const sessions = new SessionRepository(c.env.DB)
  const previousSessionId = getCookie(c, SESSION_COOKIE_NAME)
  const sessionId = createOpaqueSecret()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)

  if (previousSessionId) {
    await sessions.delete(await hashSecret(previousSessionId))
  }

  await sessions.deleteExpired(now.toISOString())
  await sessions.create({
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    idHash: await hashSecret(sessionId),
    maxExpiresAt: new Date(
      now.getTime() + SESSION_MAX_LIFETIME_MS,
    ).toISOString(),
    userId,
  })
  setSessionCookie(c, sessionId, expiresAt, now)
}

/** The signed-in user's id, renewing the session in its last week; null when the cookie has no live session. */
export async function resolveSession(
  c: Context<AppEnv>,
): Promise<string | null> {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME)

  if (!sessionId) {
    return null
  }

  const now = new Date()
  const sessions = new SessionRepository(c.env.DB)
  const session = await sessions.getByIdHash(await hashSecret(sessionId))

  if (!session) {
    return null
  }

  const expiresAt = new Date(session.expiresAt)

  if (expiresAt <= now) {
    await sessions.delete(session.idHash)
    return null
  }

  if (expiresAt.getTime() - now.getTime() < SESSION_RENEW_WINDOW_MS) {
    const renewedExpiresAt = new Date(
      Math.min(
        now.getTime() + SESSION_TTL_MS,
        new Date(session.maxExpiresAt).getTime(),
      ),
    )

    if (renewedExpiresAt > expiresAt) {
      await sessions.updateExpiresAt(
        session.idHash,
        renewedExpiresAt.toISOString(),
      )
      setSessionCookie(c, sessionId, renewedExpiresAt, now)
    }
  }

  return session.userId
}

/** Deletes the cookie's session row, so a copied cookie stops working, and clears the cookie. */
export async function endSession(c: Context<AppEnv>) {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME)

  if (sessionId) {
    await new SessionRepository(c.env.DB).delete(await hashSecret(sessionId))
  }

  deleteCookie(c, SESSION_COOKIE_NAME, {
    ...getCookieSecurityOptions(c.req.url),
    path: "/",
  })
}
