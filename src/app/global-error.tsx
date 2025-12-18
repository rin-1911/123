"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
              系统错误
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              {error.message || "发生了一个严重错误"}
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1.5rem",
                backgroundColor: "#06b6d4",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

