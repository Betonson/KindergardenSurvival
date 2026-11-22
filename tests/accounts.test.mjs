import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, login, logout, newUsersGetFullRights, register, saveFullRights, sessionAccount } from "../lib/store.ts";

process.env.ACADEMY_DATA_DIR = "memory://";
after(async () => (await database()).close());

function details(username, email) {
  return { username, email, firstName: "Анна", lastName: "Лесная", password: "forest-test-2026", confirmation: "forest-test-2026" };
}

test("Уникальность, выдача ролей и завершение сессий", async () => {
  assert.equal(await newUsersGetFullRights(), true);
  const first = details("Лиса", "fox@example.test");
  const firstToken = (await register(first)).token;
  assert.equal((await sessionAccount(firstToken)).role, "admin");
  assert.ok(await login({ identifier: "  ЛИСА ", password: first.password }));
  assert.ok(await login({ identifier: " FOX@example.test ", password: first.password }));
  assert.equal(await login({ identifier: first.email, password: "incorrect" }), null);

  const second = details("Сова", "owl@example.test");
  const race = await Promise.all([register(second), register(second)]);
  assert.equal(race.filter(result => result.token).length, 1);
  assert.deepEqual(Object.keys(race.find(result => result.errors).errors).sort(), ["email", "username"]);
  const both = await register({ ...first, username: "  ЛИСА ", email: "Owl@example.test" });
  assert.deepEqual(Object.keys(both.errors).sort(), ["email", "username"]);
  assert.deepEqual(Object.keys((await register({ ...first, username: "НовоеИмя" })).errors), ["email"]);
  assert.deepEqual(Object.keys((await register({ ...first, email: "new@example.test" })).errors), ["username"]);
  assert.ok((await register({ ...second, confirmation: "different" })).errors.confirmation);

  assert.equal(await saveFullRights(firstToken, false), true);
  const teacher = (await register(details("Педагог", "teacher@example.test"))).token;
  const teacherAccount = await sessionAccount(teacher);
  assert.equal(teacherAccount.role, "teacher");
  assert.equal(await saveFullRights(teacher, true), false);
  assert.equal(await saveFullRights("fake-token", true), false);
  const db = await database();
  await db.query("UPDATE accounts SET role = 'methodist' WHERE id = $1", [teacherAccount.id]);
  assert.equal((await sessionAccount(teacher)).role, "methodist");
  assert.equal(await saveFullRights(teacher, true), false);
  assert.equal((await sessionAccount(firstToken)).role, "admin");
  assert.equal(await saveFullRights(firstToken, true), true);
  assert.equal((await sessionAccount((await register(details("Третий", "third@example.test"))).token)).role, "admin");
  await logout(firstToken);
  assert.equal(await sessionAccount(firstToken), null);
  assert.equal(await saveFullRights(firstToken, false), false);
});
