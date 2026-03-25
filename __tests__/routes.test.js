const request = require("supertest");
const express = require("express");
const routes = require("../src/routes");
const { initializeTestDb } = require("./test-database");

// Mock the database module to use test database
jest.mock("../src/database", () => ({
  getDbConnection: () => require("./test-database").getTestDbConnection(),
}));

// Simple app setup for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Simple mock for res.render
  app.use((req, res, next) => {
    res.render = (view, locals) => res.json({ view, locals });
    next();
  });

  app.use("/", routes);
  return app;
}

describe("Routes", () => {
  let app;
  let db;

  beforeEach(async () => {
    app = createTestApp();
    db = await initializeTestDb();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  test("GET / should return 200", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("home");
  });

  test("GET /recipes should return all recipes", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Pasta", "pasta, sauce", "boil and mix"],
    );
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Salad", "lettuce, tomato", "mix together"],
    );

    const response = await request(app).get("/recipes");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("recipes");
    expect(response.body.locals.recipes).toHaveLength(2);
  });

  test("GET /recipes/:id should return a recipe when it exists", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Omelette", "eggs, butter", "whisk and fry"],
    );
    const created = await db.get("SELECT * FROM recipes WHERE title = ?", [
      "Omelette",
    ]);

    const response = await request(app).get(`/recipes/${created.id}`);
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("recipe");
    expect(response.body.locals.recipe.title).toBe("Omelette");
  });

  test("GET /recipes/:id should return 404 for a non-existent recipe", async () => {
    const response = await request(app).get("/recipes/99999");
    expect(response.status).toBe(404);
  });

  test("POST /recipes should create a new recipe", async () => {
    const newRecipe = {
      title: "New Test Recipe",
      ingredients: "New test ingredients",
      method: "New test method",
    };

    const response = await request(app).post("/recipes").send(newRecipe);

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toBe("/recipes");

    // Verify recipe was created
    const recipe = await db.get("SELECT * FROM recipes WHERE title = ?", [
      newRecipe.title,
    ]);
    expect(recipe).toBeDefined();
    expect(recipe.title).toBe(newRecipe.title);
  });

  test("POST /recipes/:id/edit should update an existing recipe", async () => {
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Old Title", "old ingredients", "old method"],
    );
    const created = await db.get("SELECT * FROM recipes WHERE title = ?", [
      "Old Title",
    ]);

    const response = await request(app)
      .post(`/recipes/${created.id}/edit`)
      .send({
        title: "New Title",
        ingredients: "new ingredients",
        method: "new method",
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`/recipes/${created.id}`);

    const updated = await db.get("SELECT * FROM recipes WHERE id = ?", [
      created.id,
    ]);
    expect(updated.title).toBe("New Title");
    expect(updated.ingredients).toBe("new ingredients");
    expect(updated.method).toBe("new method");
  });

  test("DELETE /recipes/:id should delete recipe and GET returns 404", async () => {
    // Create a recipe to delete
    await db.run(
      "INSERT INTO recipes (title, ingredients, method) VALUES (?, ?, ?)",
      ["Recipe to Delete", "ingredients", "method"],
    );
    const created = await db.get("SELECT * FROM recipes WHERE title = ?", [
      "Recipe to Delete",
    ]);
    expect(created).toBeDefined();

    // Delete the recipe
    const deleteResponse = await request(app).delete(`/recipes/${created.id}`);
    expect(deleteResponse.status).toBe(204);

    // Confirm it returns 404
    const getResponse = await request(app).get(`/recipes/${created.id}`);
    expect(getResponse.status).toBe(404);
  });
});
