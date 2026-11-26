"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Compass, ShieldCheck } from "lucide-react";

export const FIVE_MINUTES_IN_SECONDS = 5 * 60;

export interface SessionInactivityWarningDialogProps {
  isAuthenticated?: boolean;
  remainingSeconds?: number;
  warningThresholdSeconds?: number;
  onStayLoggedIn?: () => void;
  onSessionExpired?: () => void;
}

export function formatCountdownSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const SessionInactivityWarningDialog: React.FC<
  SessionInactivityWarningDialogProps
> = ({
  isAuthenticated = true,
  remainingSeconds = FIVE_MINUTES_IN_SECONDS,
  warningThresholdSeconds = FIVE_MINUTES_IN_SECONDS,
  onStayLoggedIn,
  onSessionExpired,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(remainingSeconds);
  const [expiredNotified, setExpiredNotified] = useState<boolean>(false);

  useEffect(() => {
    setSecondsLeft(remainingSeconds);
    setExpiredNotified(false);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isAuthenticated || secondsLeft <= 0) {
      if (isAuthenticated && secondsLeft <= 0 && !expiredNotified) {
        setExpiredNotified(true);
        onSessionExpired?.();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiredNotified, isAuthenticated, onSessionExpired, secondsLeft]);

  const handleStayLoggedIn = useCallback(() => {
    setSecondsLeft(FIVE_MINUTES_IN_SECONDS);
    setExpiredNotified(false);
    onStayLoggedIn?.();
  }, [onStayLoggedIn]);

  const shouldShowWarning =
    isAuthenticated && secondsLeft > 0 && secondsLeft <= warningThresholdSeconds;

  if (!shouldShowWarning) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-inactivity-title"
      aria-describedby="session-inactivity-description"
      data-testid="session-inactivity-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-white p-5 text-slate-900 shadow-xl dark:border-amber-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6 md:max-w-lg lg:p-7">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2
              id="session-inactivity-title"
              className="text-base font-bold tracking-tight sm:text-lg md:text-xl"
            >
              Session Inactivity Warning
            </h2>
            <p
              id="session-inactivity-description"
              className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm"
            >
              Your authenticated session will expire due to inactivity in{" "}
              <span
                data-testid="session-countdown"
                className="font-mono font-semibold text-amber-700 dark:text-amber-300"
              >
                {formatCountdownSeconds(secondsLeft)}
              </span>{" "}
              (5-minute warning window).
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            data-testid="stay-logged-in-button"
            onClick={handleStayLoggedIn}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-offset-slate-900 sm:w-auto sm:text-sm"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-12 text-center text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
        Page Not Found
      </h1>
      <p className="max-w-md text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
        The requested route could not be found in CodePulse.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:text-sm"
      >
        Return Home
      </Link>
      <SessionInactivityWarningDialog isAuthenticated={false} />
    </main>
  );
}
