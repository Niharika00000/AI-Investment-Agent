const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { SystemMessage, HumanMessage } = require("@langchain/core/messages");

async function run() {
  try {
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, // Key from .env
      model: "gemini-2.5-flash"
    });
    console.log("Invoking LLM...");
    const result = await llm.invoke([
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage("Hello!")
    ]);
    console.log("Success:", result.content);
  } catch (error) {
    console.error("Error invoking LLM:", error.status, error.statusText, error.message);
    console.dir(error, { depth: null });
  }
}

run();
