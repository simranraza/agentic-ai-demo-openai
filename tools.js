// tools.js
export const tools = [
  {
    type: "function",
    name: "list_products",
    description: "List products. Optional limit and sort.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100 },
        sort: { type: "string", enum: ["asc", "desc"] }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "get_product",
    description: "Get a product by id.",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "integer", minimum: 1 }
      },
      required: ["product_id"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "list_categories",
    description: "List product categories.",
    parameters: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    type: "function",
    name: "list_products_by_category",
    description: "List products in a category.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", minLength: 1 }
      },
      required: ["category"],
      additionalProperties: false
    }
  },

  {
    type: "function",
    name: "get_cart",
    description: "Get cart by id.",
    parameters: {
      type: "object",
      properties: {
        cart_id: { type: "integer", minimum: 1 }
      },
      required: ["cart_id"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "list_user_carts",
    description: "List carts for a user id.",
    parameters: {
      type: "object",
      properties: {
        user_id: { type: "integer", minimum: 1 }
      },
      required: ["user_id"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "create_cart",
    description: "Create a cart for a user with items.",
    parameters: {
      type: "object",
      properties: {
        user_id: { type: "integer", minimum: 1 },
        date: { type: "string", description: "ISO date string, e.g. 2026-02-21" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              product_id: { type: "integer", minimum: 1 },
              quantity: { type: "integer", minimum: 1, maximum: 999 }
            },
            required: ["product_id", "quantity"],
            additionalProperties: false
          }
        }
      },
      required: ["user_id", "date", "items"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "update_cart",
    description: "Replace an existing cart's items (full update).",
    parameters: {
      type: "object",
      properties: {
        cart_id: { type: "integer", minimum: 1 },
        user_id: { type: "integer", minimum: 1 },
        date: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              product_id: { type: "integer", minimum: 1 },
              quantity: { type: "integer", minimum: 1, maximum: 999 }
            },
            required: ["product_id", "quantity"],
            additionalProperties: false
          }
        }
      },
      required: ["cart_id", "user_id", "date", "items"],
      additionalProperties: false
    }
  }
];