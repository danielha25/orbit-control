"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  data: unknown;
  error: string | null;
};

const modeConfig: Record<
  AuthMode,
  {
    title: string;
    description: string;
    submitLabel: string;
    endpoint: string;
    successRedirect: string;
    alternateHref: string;
    alternateLabel: string;
    alternatePrompt: string;
  }
> = {
  login: {
    title: "Sign in",
    description: "Access the Orbit Control console with your operator account.",
    submitLabel: "Sign in",
    endpoint: "/api/auth/login",
    successRedirect: "/dashboard",
    alternateHref: "/register",
    alternateLabel: "Create an account",
    alternatePrompt: "No account yet?"
  },
  register: {
    title: "Create account",
    description: "Provision a local operator account for the MVP flows.",
    submitLabel: "Create account",
    endpoint: "/api/auth/register",
    successRedirect: "/login",
    alternateHref: "/login",
    alternateLabel: "Back to login",
    alternatePrompt: "Already have an account?"
  }
};

const STAR_COUNT = 220;

function AuthArt() {
  return (
    <div className="oc-auth__art" aria-hidden>
      <svg
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
        className="oc-auth__sky"
      >
        <defs>
          <radialGradient id="oc-auth-globe" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#0b1023" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0b1023" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="oc-auth-nebula" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="800" fill="#06070b" />
        <circle cx="180" cy="220" r="220" fill="url(#oc-auth-nebula)" />
        <circle cx="430" cy="540" r="280" fill="url(#oc-auth-globe)" />
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const x = (i * 73) % 600;
          const y = (i * 113) % 800;
          const r = i % 17 === 0 ? 1.6 : i % 5 === 0 ? 0.9 : 0.5;
          const opacity = 0.3 + ((i * 7) % 70) / 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="#fff"
              opacity={opacity}
            />
          );
        })}
        <g transform="translate(300 540) rotate(-22)">
          <ellipse
            cx="0"
            cy="0"
            rx="240"
            ry="60"
            fill="none"
            stroke="#7dd3fc"
            strokeOpacity="0.25"
            strokeWidth="0.8"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="180"
            ry="44"
            fill="none"
            stroke="#7dd3fc"
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="120"
            ry="28"
            fill="none"
            stroke="#7dd3fc"
            strokeOpacity="0.6"
            strokeWidth="0.8"
          />
          <circle cx="0" cy="0" r="36" fill="#0b1023" stroke="#7dd3fc" strokeOpacity="0.6" />
          <circle cx="180" cy="0" r="3" fill="#fbbf24" />
          <circle cx="-120" cy="0" r="2" fill="#7dd3fc" />
        </g>
      </svg>
      <div className="oc-auth__quote">
        <div className="oc-auth__sigil">◐</div>
        <div className="oc-auth__pull">
          Track every object that matters.
          <br />
          Build missions around them.
        </div>
        <div className="oc-auth__meta">
          <div>
            <span>Objects tracked</span>
            <b>1,284</b>
          </div>
          <div>
            <span>Active missions</span>
            <b>37</b>
          </div>
          <div>
            <span>Operators online</span>
            <b>12</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const config = modeConfig[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = (await response.json().catch(() => null)) as AuthResponse | null;

      if (!response.ok) {
        setError(result?.error ?? "Request failed");
        return;
      }

      router.push(config.successRedirect);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="oc-auth" data-testid={`${mode}-card`}>
      <AuthArt />

      <div className="oc-auth__form-col">
        <div className="oc-auth__form-wrap">
          <div className="oc-brand">
            <div className="oc-brand__mark" aria-hidden>
              <svg viewBox="0 0 32 32" width="22" height="22">
                <circle cx="16" cy="16" r="3" fill="currentColor" />
                <ellipse
                  cx="16"
                  cy="16"
                  rx="13"
                  ry="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  transform="rotate(-22 16 16)"
                />
                <circle cx="27" cy="9" r="1.6" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="oc-brand__name">Orbit Control</div>
              <div className="oc-brand__sub">Mission console</div>
            </div>
          </div>

          <div className="oc-auth__head">
            <h1 className="oc-auth__title">{config.title}</h1>
            <p className="oc-auth__sub">{config.description}</p>
          </div>

          <div className="oc-auth__tabs" role="tablist">
            <Link
              href="/login"
              role="tab"
              aria-selected={mode === "login"}
              className={`oc-auth__tab${mode === "login" ? " is-active" : ""}`}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              role="tab"
              aria-selected={mode === "register"}
              className={`oc-auth__tab${mode === "register" ? " is-active" : ""}`}
            >
              Create account
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="oc-form" data-testid={`${mode}-form`}>
            <label className="oc-field" htmlFor={`${mode}-email`}>
              <span className="oc-field__lbl">Email</span>
              <input
                id={`${mode}-email`}
                data-testid={`${mode}-email`}
                type="email"
                className="oc-input"
                autoComplete="email"
                placeholder="you@orbit.dev"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="oc-field" htmlFor={`${mode}-password`}>
              <span className="oc-field__lbl">Password</span>
              <input
                id={`${mode}-password`}
                data-testid={`${mode}-password`}
                type="password"
                className="oc-input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? (
              <div className="oc-error" data-testid={`${mode}-error`}>
                {error}
              </div>
            ) : null}

            <button
              data-testid={`${mode}-submit`}
              type="submit"
              className="oc-btn oc-btn--primary oc-btn--block"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : config.submitLabel}
            </button>

            <div className="oc-auth__hint">
              Session uses an HTTP-only cookie. Token is hashed server-side.
            </div>
          </form>

          <p className="oc-auth__alt">
            {config.alternatePrompt}{" "}
            <Link href={config.alternateHref}>{config.alternateLabel}</Link>
          </p>
        </div>

        <div className="oc-auth__foot">
          Orbit Control · MVP build · {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
