// agent.mjs
import OpenAI from "openai";
import { tools } from "./tools.js";

console.log("agent.mjs starting...");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BASE = "https://fakestoreapi.com";

// ---- Tool implementations (real HTTP calls to Fake Store API) ----
async function httpJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`.slice(0, 500));
  }
  return res.json();
}

const toolHandlers = {
  list_products: async ({ limit, sort } = {}) => {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (sort) qs.set("sort", sort);

    const path = qs.toString() ? `/products?${qs}` : "/products";
    return httpJson(`${BASE}${path}`);
  },

  get_product: async ({ product_id }) => httpJson(`${BASE}/products/${product_id}`),

  list_categories: async () => httpJson(`${BASE}/products/categories`),

  list_products_by_category: async ({ category }) =>
    httpJson(`${BASE}/products/category/${encodeURIComponent(category)}`),

  get_cart: async ({ cart_id }) => httpJson(`${BASE}/carts/${cart_id}`),

  list_user_carts: async ({ user_id }) => httpJson(`${BASE}/carts/user/${user_id}`),

  create_cart: async ({ user_id, date, items }) =>
    httpJson(`${BASE}/carts`, {
      method: "POST",
      body: JSON.stringify({
        userId: user_id,
        date,
        products: items.map((i) => ({ productId: i.product_id, quantity: i.quantity }))
      })
    }),

  update_cart: async ({ cart_id, user_id, date, items }) =>
    httpJson(`${BASE}/carts/${cart_id}`, {
      method: "PUT",
      body: JSON.stringify({
        userId: user_id,
        date,
        products: items.map((i) => ({ productId: i.product_id, quantity: i.quantity }))
      })
    })
};

function safeJsonParse(s, fallback = {}) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

// ---- Agent loop ----
async function runAgent(userInput) {
  console.log("runAgent called with:", userInput);

  // Initial request
  let response = await client.responses.create({
    model: "gpt-5.2",
    input: [
      {
        role: "system",
        content:
          "You are an ecommerce support agent for Fake Store API. Use tools to fetch facts. " +
          "Never invent product/cart data. If info is missing, ask a short clarifying question."
      },
      { role: "user", content: userInput }
    ],
    tools
  });

  const logModelOutput = (label, r) => {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(r.output, null, 2));
  };

  logModelOutput("MODEL OUTPUT (step 1)", response);

  // Resolve function calls
  let steps = 0;
  while (response.output?.some((o) => o.type === "function_call")) {
    if (++steps > 12) {
      throw new Error("Too many agent steps (possible loop). Aborting.");
    }

    const fnCalls = response.output.filter((o) => o.type === "function_call");

    const toolOutputs = [];
    for (const call of fnCalls) {
      const name = call.name;
      const args = call.arguments ? safeJsonParse(call.arguments, {}) : {};

      console.log(`\n-> TOOL CALL: ${name}(${JSON.stringify(args)})`);

      const handler = toolHandlers[name];
      if (!handler) {
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify({ error: `No handler for tool: ${name}` })
        });
        continue;
      }

      try {
        const result = await handler(args);
        console.log(`<- TOOL RESULT: ${name} OK`);
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result)
        });
      } catch (err) {
        console.log(`<- TOOL RESULT: ${name} ERROR: ${String(err?.message || err)}`);
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify({ error: String(err?.message || err) })
        });
      }
    }

    // Continue same conversation thread
    response = await client.responses.create({
      model: "gpt-5.2",
      previous_response_id: response.id,
      tools,
      input: toolOutputs
    });

    logModelOutput("MODEL OUTPUT (next step)", response);
  }

  console.log("\n=== FINAL ANSWER ===\n");
  console.log(response.output_text || "(No output_text returned)");
}

// ---- Main (with try/catch) ----
(async () => {
  try {
    console.log("About to run agent...");

    await runAgent(
      "I am user 2. Add following product to my cart.title :  Deo Spray , price : 4.25, description :  Mens Aqua Deo Spray , category :  men's clothing , Show my most recent cart, list the items with product titles and total price. " +
        "If you can't determine 'most recent', explain what you used."
		
    );

    console.log("\nAgent finished.");
  } catch (e) {
    console.error("\nAgent crashed:", e);
    process.exitCode = 1;
  }
})();