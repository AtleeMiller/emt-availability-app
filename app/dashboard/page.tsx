import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WeeklyCalendar from "./WeeklyCalendar";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <main style={{ padding: "1rem" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: ".75rem",
            marginBottom: ".75rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
              EMT / Driver Weekly Availability
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: ".85rem",
                color: "#6b7280",
              }}
            >
              Logged in as {user.name} ({user.email})
            </p>
            {isAdmin && (
              <a
                href="/admin/create-user"
                style={{
                  display: "inline-block",
                  marginTop: ".3rem",
                  fontSize: ".8rem",
                  color: "#2563eb",
                }}
              >
                Admin: create user →
              </a>
            )}
          </div>
          <form action="/api/logout" method="post" style={{ margin: 0 }}>
            <button
              formAction="/api/logout"
              formMethod="post"
              style={{
                borderRadius: 9999,
                padding: ".35rem .9rem",
                fontSize: ".85rem",
                background: "#e5e7eb",
                border: "none",
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </form>
        </header>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "1rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          }}
        >
          <WeeklyCalendar currentUserId={user.id} />
        </div>
      </div>
    </main>
  );
}
