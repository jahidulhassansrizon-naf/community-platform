const axios = require("axios");

// ============================================================
// AI SEARCH INTENT / KEYWORD GENERATOR (Gemini)
// ============================================================
const getSearchKeywordWithAI = async (rawQuery) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing!");
      return rawQuery;
    }

    const prompt = `
You are the intelligent search assistant for an e-commerce platform.
Your job is to analyze the user's search query and extract or translate it into a single, clean, highly relevant English keyword or category term (1 to 2 words max) so that product search APIs can easily match products.

User Search Query: "${rawQuery}"

Rules:
1. Understand the intent or meaning behind the query.
2. If it's in Bengali or slang or misspelled, convert it to standard English product keywords (e.g., "ঘড়ি" -> "watch", "মোবাইল" -> "phone", "জামা" -> "clothes").
3. Return ONLY a JSON object in this exact format, with no extra text:
{"keyword":"cleaned keyword"}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                keyword: {
                  type: "STRING",
                  description: "Cleaned and optimized product search keyword.",
                },
              },
              required: ["keyword"],
            },
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) return rawQuery;

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return rawQuery;

    const parsedResponse = JSON.parse(aiText);
    const refinedKeyword = parsedResponse?.keyword?.trim();

    return refinedKeyword || rawQuery;
  } catch (error) {
    console.error("AI Search Intent Error:", error.message);
    return rawQuery;
  }
};

// ============================================================
// AI CATEGORY CLEANING & GROUPING (Gemini)
// ============================================================
const getAICleanedCategories = async (rawCategories) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return rawCategories;

    const prompt = `
You are an e-commerce catalog assistant.
Here is a raw list of product categories from multiple APIs:
${JSON.stringify(rawCategories)}

Your task:
1. Clean up and group these categories into a smaller, highly professional, and organized set of clean categories (e.g., Electronics, Fashion, Beauty, Home & Kitchen, Toys, Groceries, Sports, etc.).
2. Remove redundant, messy, or overly specific sub-categories.
3. Return ONLY a JSON object in this exact format:
{"categories": ["Category 1", "Category 2", ...]}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                categories: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of cleaned and grouped categories.",
                },
              },
              required: ["categories"],
            },
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) return rawCategories;

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return rawCategories;

    const parsed = JSON.parse(aiText);
    return parsed?.categories || rawCategories;
  } catch (error) {
    console.error("AI Category Cleaning Error:", error.message);
    return rawCategories;
  }
};

// ============================================================
// GET AI CLEANED CATEGORIES FOR SHOP
// @route   GET /api/shop/categories
// @access  Public
// ============================================================
const getCategories = async (req, res) => {
  try {
    const response = await axios.get(
      "https://dummyjson.com/products/categories",
    );
    const rawCategories = response.data.map((c) =>
      typeof c === "string" ? c : c.slug,
    );

    const cleanedCategories = await getAICleanedCategories(rawCategories);

    res.json({ success: true, categories: ["all", ...cleanedCategories] });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories" });
  }
};

// ============================================================
// SEARCH PRODUCTS WITH AI INTEGRATION & CATEGORY FILTERING
// ============================================================
const searchProducts = async (req, res) => {
  const rawQuery = req.query.q ? req.query.q.trim() : "";
  const selectedCategory = req.query.category ? req.query.category.trim() : "";
  let aggregatedProducts = [];

  try {
    let query = rawQuery.toLowerCase();

    // ১. যদি সার্চ বক্স খালি থাকে, কিন্তু ড্রপডাউন থেকে ক্যাটাগরি সিলেক্ট করা হয়
    if (rawQuery === "" && selectedCategory && selectedCategory !== "all") {
      query = selectedCategory.toLowerCase();
    }
    // ২. যদি সার্চ বক্সে কিছু লেখা থাকে
    else if (rawQuery !== "") {
      const aiOptimizedKeyword = await getSearchKeywordWithAI(rawQuery);
      query = aiOptimizedKeyword.toLowerCase();
      console.log(
        `Original Query: "${rawQuery}" -> AI Optimized Query: "${query}"`,
      );
    }

    // DummyJSON-এ নির্দিষ্ট ক্যাটাগরি সার্চের জন্য সঠিক রুট হ্যান্ডেল করা হলো
    const knownCategories = [
      "beauty",
      "fragrances",
      "furniture",
      "groceries",
      "smartphones",
      "laptops",
      "skincare",
      "home-decoration",
    ];
    const isCategorySearch = knownCategories.includes(query);

    const dummyJsonUrl = isCategorySearch
      ? `https://dummyjson.com/products/category/${query}`
      : `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`;

    const sources = [
      dummyJsonUrl,
      `https://api.escuelajs.co/api/v1/products/`,
      `https://fakestoreapi.com/products`,
    ];

    const responses = await Promise.allSettled(
      sources.map((url) => axios.get(url, { timeout: 4000 })),
    );

    // ১. DummyJSON
    if (
      responses[0].status === "fulfilled" &&
      (responses[0].value.data.products ||
        Array.isArray(responses[0].value.data))
    ) {
      const productList =
        responses[0].value.data.products || responses[0].value.data;
      const items = productList.map((p) => ({
        id: `dummy-${p.id}`,
        title: p.title,
        price: p.price,
        description: p.description,
        category: p.category,
        image: p.thumbnail || p.image,
      }));
      aggregatedProducts.push(...items);
    }

    // ২. Platzi Fake Store API
    if (
      responses[1].status === "fulfilled" &&
      Array.isArray(responses[1].value.data)
    ) {
      const items = responses[1].value.data
        .filter((p) => {
          if (query === "" || query === "all") return true;
          const title = (p.title || "").toLowerCase();
          const description = (p.description || "").toLowerCase();
          const category = (p.category?.name || "").toLowerCase();
          return (
            title.includes(query) ||
            description.includes(query) ||
            category.includes(query)
          );
        })
        .map((p) => ({
          id: `platzi-${p.id}`,
          title: p.title,
          price: p.price,
          description: p.description,
          category: p.category?.name || "General",
          image:
            p.images?.[0] ||
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
        }));
      aggregatedProducts.push(...items);
    }

    // ৩. Fake Store API
    if (
      responses[2].status === "fulfilled" &&
      Array.isArray(responses[2].value.data)
    ) {
      const items = responses[2].value.data
        .filter((p) => {
          if (query === "" || query === "all") return true;
          const title = (p.title || "").toLowerCase();
          const description = (p.description || "").toLowerCase();
          const category = (p.category || "").toLowerCase();
          return (
            title.includes(query) ||
            description.includes(query) ||
            category.includes(query)
          );
        })
        .map((p) => ({
          id: `fake-${p.id}`,
          title: p.title,
          price: p.price,
          description: p.description,
          category: p.category,
          image: p.image,
        }));
      aggregatedProducts.push(...items);
    }

    // --- ৪. Smart Fallback (Toys & Others) ---
    if (aggregatedProducts.length === 0 && query !== "") {
      if (
        query.includes("toy") ||
        query.includes("kid") ||
        query.includes("game") ||
        query.includes("teddy") ||
        query.includes("bear") ||
        query.includes("doll") ||
        query.includes("car")
      ) {
        aggregatedProducts.push(
          {
            id: "fallback-toy-1",
            title: "Remote Control Racing Car",
            price: 29.99,
            description:
              "High-speed rechargeable remote control racing car toy for kids.",
            category: "Toys",
            image:
              "https://images.unsplash.com/photo-1594787318281-3046f663ab8d?w=500&auto=format&fit=crop&q=60",
          },
          {
            id: "fallback-toy-2",
            title: "Educational Building Blocks Set",
            price: 19.99,
            description:
              "Creative colorful plastic building blocks brick set for children.",
            category: "Toys",
            image:
              "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=60",
          },
          {
            id: "fallback-toy-3",
            title: "Plush Cute Teddy Bear",
            price: 15.5,
            description:
              "Soft and huggable stuffed plush teddy bear toy for toddlers.",
            category: "Toys",
            image:
              "https://images.unsplash.com/photo-1557971329-5d5448d8b5a2?w=500&auto=format&fit=crop&q=60",
          },
        );
      }
    }

    // ডুপ্লিকেট রিমুভ করা
    let uniqueProducts = Array.from(
      new Map(aggregatedProducts.map((item) => [item.title, item])).values(),
    );

    // --- ৫. Category Filtering Logic ---
    if (selectedCategory && selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      uniqueProducts = uniqueProducts.filter((p) => {
        const prodCat = (p.category || "").toLowerCase();
        return (
          prodCat.includes(catLower) ||
          catLower.includes(prodCat) ||
          prodCat.split(" ").some((word) => catLower.includes(word)) ||
          catLower.split(" ").some((word) => prodCat.includes(word))
        );
      });
    }

    // --- ৬. Fallback if Category has no products ---
    if (
      uniqueProducts.length === 0 &&
      selectedCategory &&
      selectedCategory !== "all"
    ) {
      const cat = selectedCategory.toLowerCase();

      if (
        cat.includes("fashion") ||
        cat.includes("apparel") ||
        cat.includes("clothing")
      ) {
        uniqueProducts = [
          {
            id: "fb-fa-1",
            title: "Men's Casual Stylish Jacket",
            price: 45.99,
            description: "Comfortable winter jacket.",
            category: "Fashion & Apparel",
            image:
              "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
          },
          {
            id: "fb-fa-2",
            title: "Women's Elegant Summer Dress",
            price: 35.0,
            description: "Lightweight summer dress.",
            category: "Fashion & Apparel",
            image:
              "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
          },
        ];
      } else if (cat.includes("home") || cat.includes("kitchen")) {
        uniqueProducts = [
          {
            id: "fb-hk-1",
            title: "Non-Stick Cooking Pan Set",
            price: 25.5,
            description: "Durable frying pan.",
            category: "Home & Kitchen",
            image:
              "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500",
          },
          {
            id: "fb-hk-2",
            title: "Smart LED Desk Lamp",
            price: 18.99,
            description: "Touch control table lamp.",
            category: "Home & Kitchen",
            image:
              "https://images.unsplash.com/photo-1534349762230-e1cadfefc281?w=500",
          },
        ];
      } else if (cat.includes("sport") || cat.includes("outdoor")) {
        uniqueProducts = [
          {
            id: "fb-so-1",
            title: "Professional Football Ball",
            price: 22.99,
            description: "Standard size football.",
            category: "Sports & Outdoors",
            image:
              "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500",
          },
          {
            id: "fb-so-2",
            title: "Fitness Exercise Yoga Mat",
            price: 14.99,
            description: "Anti-slip yoga mat.",
            category: "Sports & Outdoors",
            image:
              "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
          },
        ];
      } else if (cat.includes("automotive")) {
        uniqueProducts = [
          {
            id: "fb-au-1",
            title: "Car Vacuum Cleaner Portable",
            price: 28.5,
            description: "Mini handheld vacuum for car.",
            category: "Automotive",
            image:
              "https://images.unsplash.com/photo-1582293041940-8b1d3d1d9f12?w=500",
          },
        ];
      }
    }

    res.json({ success: true, products: uniqueProducts });
  } catch (error) {
    console.error("Multi-source search error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching aggregated products" });
  }
};

module.exports = {
  searchProducts,
  getCategories,
};
