import { GoogleGenerativeAI } from "@google/generative-ai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Retrieve the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Action for handling both text generation and image generation using Gemini AI
export const geminiAI = action({
  args: {
    messageBody: v.string(),
    imageBase64: v.optional(v.string()), // Image base64 as an optional argument for image generation
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Log received message body
    console.log("Received messageBody:", args.messageBody);

    // Handle text generation (starts with "@gemini-chat")
    if (args.messageBody.startsWith("@gemini-chat")) {
      const prompt = args.messageBody.replace("@gemini-chat", "").trim(); // Remove "@gemini-chat" prefix
      console.log("Generated prompt for Gemini:", prompt); // Log the prompt

      try {
        const result = await model.generateContent(prompt);
        console.log("Gemini response:", result); // Log the response

        const messageContent = result.response?.text(); // Get the generated text

        // Send the generated text back to the conversation
        await ctx.runMutation(api.messages.sendTextMessage, {
          content: messageContent || "I'm sorry, I don't have a response for that.",
          conversation: args.conversation,
          sender: "Gemini AI", // Indicate that the sender is Gemini AI
        });
      } catch (error) {
        console.error("Error generating content with text prompt:", error); // Log the error
        await ctx.runMutation(api.messages.sendTextMessage, {
          content: "Error generating content with text prompt.",
          conversation: args.conversation,
          sender: "Gemini AI",
        });
      }

    // Handle image generation (starts with "@gemini-image")
    } else if (args.messageBody.startsWith("@gemini-image") && args.imageBase64) {
      const prompt = args.messageBody.replace("@gemini-image", "").trim(); // Remove "@gemini-image" prefix
      console.log("Generated prompt for Gemini with image:", prompt); // Log the prompt

      try {
        const imagePart = {
          inlineData: {
            data: args.imageBase64.split(",")[1], // Base64 part of the image
            mimeType: "image/jpeg", // Adjust MIME type as needed (e.g., "image/png")
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        console.log("Gemini image response:", result); // Log the response

        const generatedText = result.response?.text(); // Get generated content based on image + prompt

        // Send the generated text back to the conversation
        await ctx.runMutation(api.messages.sendTextMessage, {
          content: generatedText || "No response generated for the image.",
          conversation: args.conversation,
          sender: "Gemini AI",
        });
      } catch (error) {
        console.error("Error generating content with image input:", error); // Log the error
        await ctx.runMutation(api.messages.sendTextMessage, {
          content: "Error generating content with image input.",
          conversation: args.conversation,
          sender: "Gemini AI",
        });
      }

    // Handle invalid commands
    } else {
      await ctx.runMutation(api.messages.sendTextMessage, {
        content: "Invalid command. Please start your message with @gemini-chat for text or @gemini-image for image generation.",
        conversation: args.conversation,
        sender: "Gemini AI",
      });
    }
  },
});
