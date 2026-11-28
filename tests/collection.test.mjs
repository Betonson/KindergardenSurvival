import assert from "node:assert/strict";
import { after, test } from "node:test";
import { access } from "node:fs/promises";
import { database, register, saveFullRights, sessionAccount } from "../lib/store.ts";
import { getCollection } from "../lib/collection.ts";

process.env.ACADEMY_DATA_DIR = "memory://";
after(async () => (await database()).close());

async function create(username, role) {
  const result = await register({
    username, email: username + "@example.test", role, specialization: "educator",
    firstName: "Тест", lastName: "Коллекции", password: "local-collection", confirmation: "local-collection",
  });
  return { account: await sessionAccount(result.token), token: result.token };
}

test("Коллекция выдаёт только награды за прохождения владельца аккаунта", async () => {
  const admin = await create("admin", "employee");
  await saveFullRights(admin.token, false);
  const methodist = await create("methodist", "methodist");
  const first = await create("first", "employee");
  const second = await create("second", "employee");
  const full = await getCollection(admin.account);
  assert.deepEqual(await getCollection(methodist.account), full);
  assert.deepEqual(await getCollection(first.account), []);
  const allItems = full.flatMap(topic => topic.materials.flatMap(material => material.items));
  assert.equal(new Set(allItems.map(item => item.id)).size, allItems.length);
  for (const item of allItems) await access(new URL("../content/collection/art/" + item.id + ".webp", import.meta.url));
  for (const topic of full) {
    assert.ok(topic.materials.length);
    for (const material of topic.materials) await access(new URL("../public" + material.image, import.meta.url));
  }
  const db = await database();
  for (let i = 0; i < 2; i++) {
    await db.query("INSERT INTO adventure_completions (account_id, adventure_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [first.account.id, "heavy-pumpkin"]);
  }
  const unlocked = await getCollection(first.account);
  assert.deepEqual(unlocked.map(topic => topic.id), ["observation", "cooperation"]);
  const materials = unlocked.flatMap(topic => topic.materials);
  assert.deepEqual(materials.map(material => material.id), ["notice-the-idea", "ask-about-help"]);
  assert.deepEqual(materials.flatMap(material => material.items.map(item => item.id)), ["magnifier", "notebook", "wagon"]);
  assert.deepEqual(await getCollection(second.account), []);
  const count = await db.query("SELECT count(*)::int AS total FROM adventure_completions WHERE account_id = $1", [first.account.id]);
  assert.equal(count.rows[0].total, 1);
});
