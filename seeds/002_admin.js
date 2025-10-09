import bcrypt from "bcrypt";

export async function seed(knex) {
  if (process.env.NODE_ENV !== "development") {
    console.log("Skipping dev user seed in non-dev environment");
    return;
  }
await knex("admins").del();
  const hash = await bcrypt.hash("123456", 10);
  const hash2 = await bcrypt.hash("54321", 10);
  await knex("admins").insert([{ username: "test-user", password: hash },{username: "test-user2",password:hash2}]);
}
                                    
