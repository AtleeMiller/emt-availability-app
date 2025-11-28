import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          background: "#ffffff",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          boxShadow: "0 12px 35px rgba(15,23,42,0.2)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>
          EMT / Driver Login
        </h1>
        <p
          style={{
            fontSize: ".85rem",
            color: "#6b7280",
            marginBottom: ".75rem",
          }}
        >
          Use the email and password the admin gave you.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
