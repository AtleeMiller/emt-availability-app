import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateUserForm from "./CreateUserForm";

export default async function AdminCreateUserPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    // non-admins can't see this page at all
    redirect("/dashboard");
  }

  return (
    <main style={{ padding: "1rem" }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", marginBottom: ".25rem" }}>
          Admin: Create User
        </h1>
        <p style={{ fontSize: ".85rem", color: "#6b7280", marginBottom: "1rem" }}>
          Add drivers / EMTs. The password is stored securely (bcrypt hash) in the
          database.
        </p>

        <CreateUserForm />
      </div>
    </main>
  );
}
