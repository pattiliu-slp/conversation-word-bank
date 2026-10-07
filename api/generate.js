// Server-side proxy for the Anthropic API.
// The browser never sees the API key, and it can't choose the model or
// response length: those are fixed here so a stranger who finds this
// endpoint can't run up large bills.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"; // override in Vercel env vars if needed
const MAX_TOKENS = 1200;          // hard cap on response length (a 24-word bank uses ~400)
const MAX_PROMPT_CHARS = 4000;    // the app's prompt is ~1,500 characters; reject anything much larger

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const messages = req.body && req.body.messages;
  const valid =
    Array.isArray(messages) &&
    messages.length === 1 &&
    messages[0].role === "user" &&
    typeof messages[0].content === "string" &&
    messages[0].content.length > 0 &&
    messages[0].content.length <= MAX_PROMPT_CHARS;

  if (!valid) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: messages[0].content }],
      }),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Upstream request failed" });
  }
};
