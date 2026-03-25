const { getTestDbConnection, initializeTestDb } = require("./test-database");

describe("Database Operations", () => {
  let db;

  beforeEach(async () => {
    db = await initializeTestDb();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  test("should create recipes table", async () => {
    const tableInfo = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'",
    );
    expect(tableInfo).toHaveLength(1);
    expect(tableInfo[0].name).toBe("recipes");
  });

  test("should insert a new recipe", async () => {
    const title = "Test Recipe";
    const ingredients = "Test ingredients";
    const method = "Test method";

    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      [title, ingredients, method],
    );

    const recipe = await db.get("SELECT * FROM recipes WHERE title = ?", [
      title,
    ]);
    expect(recipe).toBeDefined();
    expect(recipe.title).toBe(title);
    expect(recipe.ingredients).toBe(ingredients);
    expect(recipe.method).toBe(method);
  });

  test("should retrieve all recipes", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Recipe A", "ing A", "method A"],
    );
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Recipe B", "ing B", "method B"],
    );

    const recipes = await db.all("SELECT * FROM recipes");
    expect(recipes).toHaveLength(2);
  });

  test("should update an existing recipe", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Original", "orig ing", "orig method"],
    );
    const inserted = await db.get("SELECT * FROM recipes WHERE title = ?", [
      "Original",
    ]);

    await db.run(
      "UPDATE recipes SET title = ?, ingredients = ?, method = ? WHERE id = ?",
      ["Updated", "new ing", "new method", inserted.id],
    );

    const updated = await db.get("SELECT * FROM recipes WHERE id = ?", [
      inserted.id,
    ]);
    expect(updated.title).toBe("Updated");
    expect(updated.ingredients).toBe("new ing");
    expect(updated.method).toBe("new method");
  });

  test("should delete a recipe", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["To Delete", "ing", "method"],
    );
    const inserted = await db.get("SELECT * FROM recipes WHERE title = ?", [
      "To Delete",
    ]);

    await db.run("DELETE FROM recipes WHERE id = ?", [inserted.id]);

    const deleted = await db.get("SELECT * FROM recipes WHERE id = ?", [
      inserted.id,
    ]);
    expect(deleted).toBeUndefined();
  });
});
