export type Role = "admin" | "methodist" | "employee";

export const roleLabels: Record<Role, string> = {
  admin: "Администратор",
  methodist: "Методист",
  employee: "Сотрудник",
};

export const specializationLabels = {
  educator: "Воспитатель",
  assistant: "Помощник",
  specialist: "Специалист",
  other: "Другой сотрудник",
};
export type Specialization = keyof typeof specializationLabels;
export type Account = { id: string; username: string; role: Role; specialization: Specialization | null };
export type AuthField = "identifier" | "username" | "firstName" | "lastName" | "email" | "password" | "confirmation" | "role" | "specialization";
export type FieldErrors = Partial<Record<AuthField, string>>;
