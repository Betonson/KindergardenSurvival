import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, login, logout, newUsersGetFullRights, register, saveFullRights, sessionAccount } from "../lib/store.ts";

process.env.ACADEMY_DATA_DIR = "memory://";
after(async () => (await database()).close());

function details(username, email) {
  return { username, email, firstName: "Анна", lastName: "Лесная", role: "employee", specialization: "educator", password: "forest-test-2026", confirmation: "forest-test-2026" };
}

test("Уникальность, выдача ролей и завершение сессий", async () => {
  assert.equal(await newUsersGetFullRights(), true);
  const first = details("Лиса", "fox@example.test");
  const firstToken = (await register(first)).token;
  assert.equal((await sessionAccount(firstToken)).role, "admin");
  assert.equal((await sessionAccount(firstToken)).specialization, "educator");
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
  assert.ok((await register({ ...second, role: "admin" })).errors.role);
  assert.ok((await register({ ...second, specialization: "" })).errors.specialization);
  assert.ok((await register({ ...second, specialization: "toString" })).errors.specialization);

  assert.equal(await saveFullRights(firstToken, false), true);
  for (const specialization of ["educator", "assistant", "specialist", "other"]) {
    const employee = (await register({ ...details(specialization, specialization + "@example.test"), specialization })).token;
    const account = await sessionAccount(employee);
    assert.equal(account.role, "employee");
    assert.equal(account.specialization, specialization);
    assert.equal(await saveFullRights(employee, true), false);
  }
  assert.equal(await saveFullRights("fake-token", true), false);
  const methodist = (await register({ ...details("Методист", "m@example.test"), role: "methodist" })).token;
  assert.equal((await sessionAccount(methodist)).role, "methodist");
  assert.equal((await sessionAccount(methodist)).specialization, null);
  assert.equal(await saveFullRights(methodist, true), false);
  assert.equal((await sessionAccount(firstToken)).role, "admin");
  assert.equal(await saveFullRights(firstToken, true), true);
  const elevated = (await register({ ...details("Третий", "third@example.test"), role: "methodist" })).token;
  assert.equal((await sessionAccount(elevated)).role, "admin");
  assert.equal((await sessionAccount(elevated)).specialization, null);
  await logout(firstToken);
  assert.equal(await sessionAccount(firstToken), null);
  assert.equal(await saveFullRights(firstToken, false), false);
});
