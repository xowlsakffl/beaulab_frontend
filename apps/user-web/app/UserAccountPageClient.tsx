"use client";

import { useEffect, useState, type FormEvent } from "react";
import { monitorWebSession } from "@beaulab/api-client";
import type { UserSession } from "@beaulab/types";
import { userApi, userSession } from "../lib/api";
import styles from "./account.module.css";

export default function UserAccountPageClient() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void userSession
      .ensure()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) setError("로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    return monitorWebSession(userApi, "user", {
      onExpired: () => {
        setSession(null);
        setError("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      },
      onChanged: () => window.location.reload(),
    });
  }, [session]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSession(await userSession.login({ email: email.trim(), password }));
      setPassword("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : (failure as { error?: { message?: string } })?.error?.message || "로그인하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await userSession.logout();
      setSession(null);
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <h1>뷰랩</h1>
        {checking ? (
          <p role="status">로그인 확인 중</p>
        ) : session ? (
          <>
            <h2>내 계정</h2>
            <dl>
              <dt>닉네임</dt>
              <dd>{session.profile.nickname || session.profile.name}</dd>
              <dt>이메일</dt>
              <dd>{session.profile.email}</dd>
            </dl>
            <button type="button" onClick={signOut} disabled={busy}>
              로그아웃
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2>로그인</h2>
            <label htmlFor="user-email">이메일</label>
            <input
              id="user-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <label htmlFor="user-password">비밀번호</label>
            <input
              id="user-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="submit" disabled={busy}>
              {busy ? "로그인 중" : "로그인"}
            </button>
          </form>
        )}
        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
