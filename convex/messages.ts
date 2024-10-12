import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Send a text message mutation
export const sendTextMessage = mutation({
  args: {
    sender: v.string(),
    content: v.string(),
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversation))
      .first();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (!conversation.participants.includes(user._id)) {
      throw new ConvexError("You are not part of this conversation");
    }

    await ctx.db.insert("messages", {
      sender: args.sender,
      content: args.content,
      conversation: args.conversation,
      messageType: "text",
    });

    // Handle Gemini AI chat and image commands
    if (args.content.startsWith("@gemini-chat")) {
      await ctx.scheduler.runAfter(0, api.openai.geminiAI, {
        messageBody: args.content.replace("@gemini-chat", "").trim(), // Remove prefix
        conversation: args.conversation,
      });
    } else if (args.content.startsWith("@gemini-image")) {
      await ctx.scheduler.runAfter(0, api.openai.geminiAI, {
        messageBody: args.content.replace("@gemini-image", "").trim(), // Remove prefix
        conversation: args.conversation,
      });
    }
  },
});

// Send a ChatGPT message mutation
export const sendChatGPTMessage = mutation({
  args: {
    content: v.string(),
    conversation: v.id("conversations"),
    messageType: v.union(v.literal("text"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      content: args.content,
      sender: "ChatGPT",
      messageType: args.messageType,
      conversation: args.conversation,
    });
  },
});

// Get messages query
export const getMessages = query({
  args: {
    conversation: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversation", args.conversation))
      .collect();

    const userProfileCache = new Map();

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        if (message.sender === "ChatGPT") {
          const image = message.messageType === "text" ? "/gpt.png" : "dall-e.png";
          return { ...message, sender: { name: "ChatGPT", image } };
        }
        let sender;
        // Check if sender profile is in cache
        if (userProfileCache.has(message.sender)) {
          sender = userProfileCache.get(message.sender);
        } else {
          // Fetch sender profile from the database
          sender = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), message.sender))
            .first();
          // Cache the sender profile
          userProfileCache.set(message.sender, sender);
        }

        return { ...message, sender };
      })
    );

    return messagesWithSender;
  },
});

// Send an image mutation
export const sendImage = mutation({
  args: { imgId: v.id("_storage"), sender: v.id("users"), conversation: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const content = (await ctx.storage.getUrl(args.imgId)) as string;

    await ctx.db.insert("messages", {
      content: content,
      sender: args.sender,
      messageType: "image",
      conversation: args.conversation,
    });
  },
});

// Send a video mutation
export const sendVideo = mutation({
  args: { videoId: v.id("_storage"), sender: v.id("users"), conversation: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const content = (await ctx.storage.getUrl(args.videoId)) as string;

    await ctx.db.insert("messages", {
      content: content,
      sender: args.sender,
      messageType: "video",
      conversation: args.conversation,
    });
  },
});
