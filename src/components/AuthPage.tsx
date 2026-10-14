import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { Sun, Moon, ArrowLeft, ChevronRight } from "lucide-react";
import { authApi } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

type Mode = "signin" | "signup";

export default function Auth({ onAuthed }: { onAuthed: (user: any) => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bắt access_token từ Google OAuth Redirect (#access_token=...)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleGoogleToken(token);
      }
    }
  }, []);

  const Accent = "#559DD2";
  const isSignUp = mode === "signup";

  const handleGoogleToken = async (token: string) => {
    try {
      setGoogleLoading(true);
      setAuthError(null);
      let user: any = null;

      // 1. Lấy thông tin tài khoản trực tiếp từ Google UserInfo API
      try {
        const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          user = {
            id: gData.sub || String(Date.now()),
            email: gData.email,
            displayName: gData.name,
            username: gData.email ? gData.email.split("@")[0] : (gData.name || "User"),
            avatarUrl: gData.picture,
            role: 0,
            portfolioAccount: {
              virtualBalance: 10000,
              holdings: [],
              trades: []
            }
          };
        }
      } catch (gErr) {
        console.warn("Direct google userinfo failed:", gErr);
      }

      // 2. Thử đồng bộ với backend nếu có
      try {
        const backendUser = await authApi.googleLogin({ token });
        if (backendUser) user = backendUser;
      } catch (bErr) {
        console.warn("Backend not available, using Google profile directly:", bErr);
      }

      if (user) {
        onAuthed(user);
      } else {
        throw new Error("Không thể xác thực thông tin tài khoản Google.");
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      const msg = err.message || "Đăng nhập Google thất bại.";
      setAuthError(msg);
      alert(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDirectGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "701652498708-4naklag3anh6prdg7rgqrucqakujpm15.apps.googleusercontent.com";
    const redirectUri = window.location.origin;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;
    window.location.href = url;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "var(--background)",
        color: "var(--foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 12 : 24,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => window.location.href = "/"}
        style={{
          position: "absolute",
          top: isMobile ? 16 : 24,
          left: isMobile ? 16 : 24,
          height: 40,
          padding: "0 16px",
          borderRadius: 20,
          border: "1px solid var(--border)",
          background: "var(--secondary)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          color: "var(--foreground)",
          transition: "all 0.2s",
          zIndex: 50,
          fontWeight: 600,
          fontSize: 14,
        }}
        aria-label="Back to home"
      >
        <ArrowLeft size={18} />
        {!isMobile && "Trang chủ"}
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: isMobile ? 16 : 24,
          right: isMobile ? 16 : 24,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--foreground)",
          transition: "all 0.2s",
          zIndex: 50,
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div
        style={{
          position: "relative",
          width: "min(1100px, 100%)",
          height: isMobile ? "auto" : 620,
          minHeight: isMobile ? 500 : "unset",
          background: "var(--card)",
          borderRadius: 18,
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div
          style={{
            position: isMobile ? "relative" : "absolute",
            inset: 0,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            zIndex: 1,
            width: "100%",
          }}
        >
          {(!isMobile || isSignUp) && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "40px 20px" : 48,
              minHeight: isMobile ? 400 : "100%",
              height: isMobile ? "auto" : "100%",
            }}>
              <div style={{ width: 380, maxWidth: "100%", opacity: isSignUp ? 1 : (isMobile ? 0 : 0), pointerEvents: isSignUp ? "auto" : "none", transition: "opacity .4s", display: isSignUp || !isMobile ? "block" : "none" }}>
                <SignUpForm onAuthed={onAuthed} accent={Accent} onGoogleDirectLogin={handleDirectGoogleLogin} googleLoading={googleLoading} theme={theme} onGoToSignIn={() => setMode("signin")} isMobile={isMobile} />
              </div>
            </div>
          )}

          {(!isMobile || !isSignUp) && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "40px 20px" : 48,
              minHeight: isMobile ? 400 : "100%",
              height: isMobile ? "auto" : "100%",
            }}>
              <div style={{ width: 380, maxWidth: "100%", opacity: !isSignUp ? 1 : (isMobile ? 0 : 0), pointerEvents: !isSignUp ? "auto" : "none", transition: "opacity .4s", display: !isSignUp || !isMobile ? "block" : "none" }}>
                <SignInForm onAuthed={onAuthed} accent={Accent} onGoogleDirectLogin={handleDirectGoogleLogin} googleLoading={googleLoading} theme={theme} onGoToSignUp={() => setMode("signup")} isMobile={isMobile} />
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "50%",
              transform: isSignUp ? "translateX(100%)" : "translateX(0%)",
              transition: "transform .7s cubic-bezier(.2,.8,.2,1)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: Accent,
                clipPath: isSignUp
                  ? "ellipse(90% 130% at 100% 50%)"
                  : "ellipse(90% 130% at 0% 50%)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 12,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 48px",
                textAlign: "center",
                color: "#111",
              }}
            >
              {isSignUp ? (
                <div style={{ maxWidth: 360 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>
                    One of us?
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, marginTop: 10 }}>
                    Welcome Back
                  </div>
                  <div style={{ marginTop: 12, opacity: 0.75 }}>
                    Đăng nhập để tiếp tục.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    style={ctaBtnStyle()}
                  >
                    SIGN IN
                  </button>
                </div>
              ) : (
                <div style={{ maxWidth: 360 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>
                    New here?
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, marginTop: 10 }}>
                    Create Account
                  </div>
                  <div style={{ marginTop: 12, opacity: 0.75 }}>
                    Tạo tài khoản để bắt đầu trải nghiệm SimuCryto.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    style={ctaBtnStyle()}
                  >
                    SIGN UP
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ctaBtnStyle(): React.CSSProperties {
  return {
    marginTop: 28,
    padding: "10px 28px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.8)",
    background: "rgba(255,255,255,0.18)",
    fontWeight: 700,
    cursor: "pointer",
    color: "#111",
  };
}

function Input({ accent, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { accent: string }) {
  return (
    <input
      {...rest}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--secondary)",
        color: "var(--foreground)",
        outline: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}


function GoogleButton({ onClick, loading, theme }: { onClick: () => void; loading?: boolean; theme: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#ffffff",
        color: "var(--foreground)",
        fontWeight: 600,
        fontSize: 14,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "all 0.15s ease",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{loading ? "Đang kết nối Google..." : "Tiếp tục với Google"}</span>
    </button>
  );
}

function SignInForm({
  onAuthed,
  accent,
  onGoToSignUp,
  isMobile,
  onGoogleDirectLogin,
  googleLoading,
  theme,
}: {
  onAuthed: (user: any) => void;
  accent: string;
  onGoToSignUp: () => void;
  isMobile: boolean;
  onGoogleDirectLogin: () => void;
  googleLoading: boolean;
  theme: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.login({ email, password });
      onAuthed(user);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 34, fontWeight: 800, textAlign: "center", marginBottom: 22 }}>Sign in</h2>
      <div style={{ display: "grid", gap: 14 }}>
        <Input accent={accent} required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input accent={accent} required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            background: accent,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            color: "#000",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, opacity: 0.5 }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <GoogleButton onClick={onGoogleDirectLogin} loading={googleLoading} theme={theme} />
      </div>

      {isMobile && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontSize: 14, opacity: 0.7 }}>Don't have an account? </span>
          <button
            type="button"
            onClick={onGoToSignUp}
            style={{
              background: "transparent",
              border: "none",
              color: accent,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign Up
          </button>
        </div>
      )}
    </form>
  );
}

function SignUpForm({
  onAuthed,
  accent,
  onGoToSignIn,
  isMobile,
  onGoogleDirectLogin,
  googleLoading,
  theme,
}: {
  onAuthed: (user: any) => void;
  accent: string;
  onGoToSignIn: () => void;
  isMobile: boolean;
  onGoogleDirectLogin: () => void;
  googleLoading: boolean;
  theme: string;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.register({ username, email, password });
      onAuthed(user);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 34, fontWeight: 800, textAlign: "center", marginBottom: 22 }}>Sign up</h2>
      <div style={{ display: "grid", gap: 14 }}>
        <Input accent={accent} required placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <Input accent={accent} required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input accent={accent} required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            background: accent,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            color: "#000",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, opacity: 0.5 }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <GoogleButton onClick={onGoogleDirectLogin} loading={googleLoading} theme={theme} />
      </div>

      {isMobile && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontSize: 14, opacity: 0.7 }}>Already have an account? </span>
          <button
            type="button"
            onClick={onGoToSignIn}
            style={{
              background: "transparent",
              border: "none",
              color: accent,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign In
          </button>
        </div>
      )}
    </form>
  );
}
