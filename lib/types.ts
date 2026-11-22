export type Role = "admin" | "methodist" | "teacher";

export const roleLabels: Record<Role, string> = {
  admin: "Администратор",
  methodist: "Методист",
  teacher: "Педагог",
};

export type Account = { id: string; username: string; role: Role };
export type AuthField = "identifier" | "username" | "firstName" | "lastName" | "email" | "password" | "confirmation";
export type FieldErrors = Partial<Record<AuthField, string>>;
