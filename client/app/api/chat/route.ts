import { NextRequest, NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage.content;

    // Placholder Logic for Media Generation Tools
    if (userMessageContent.startsWith("/image ")) {
      const prompt = userMessageContent.replace("/image ", "").trim();
      const apiKey = process.env.HF_API;
      if (!apiKey) {
        return NextResponse.json({ error: "HF_API key not configured" }, { status: 500 });
      }

      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!hfRes.ok) {
        return NextResponse.json({ error: "Image generation failed on Hugging Face" }, { status: 500 });
      }

      const buffer = await hfRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const imageUrl = `data:image/jpeg;base64,${base64}`;

      return NextResponse.json({ reply: `Here is your generated image:\n\n![${prompt}](${imageUrl})` });
    }
    
    if (userMessageContent.startsWith("/video ")) {
      const prompt = userMessageContent.replace("/video ", "").trim();
      const apiKey = process.env.FAL_AI;
      
      if (!apiKey) {
        return NextResponse.json({ error: "FAL_AI key not configured" }, { status: 500 });
      }

      const falRes = await fetch("https://fal.run/fal-ai/kling-video/v1/standard/text-to-video", {
        method: "POST",
        headers: {
            "Authorization": `Key ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!falRes.ok) {
        const err = await falRes.text();
        return NextResponse.json({ error: `Video generation failed: ${err}` }, { status: 500 });
      }

      const data = await falRes.json();
      const videoUrl = data.video?.url || data.url;

      return NextResponse.json({ reply: `Here is your generated video:\n\n![video:${prompt}](${videoUrl})` });
    }

    // Default to Groq Llama 3 API if no model specified
    const selectedModel = model || "llama-3.3-70b-versatile";

    if (selectedModel === "cohere") {
      const apiKey = process.env.COHERE_API || "";
      if (!apiKey) {
        return NextResponse.json({ error: "Cohere API key is not configured" }, { status: 500 });
      }

      const cohere = new CohereClientV2({
        token: apiKey,
      });

      const cohereMessages = [
        { role: "system", content: "You are NxtAI. Be concise." },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        }))
      ];

      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: cohereMessages as any,
      });

      // cohere-ai v2 returns text in message.content[0].text
      // Handle it cleanly with optional chaining
      const textContent = (response.message?.content as any)?.[0]?.text;
      const reply = textContent || String(response.message?.content || "");
      
      return NextResponse.json({ reply });
    }

    let apiUrl = "";
    let apiKey = "";
    let requestBody: any = {};
    let headers: any = { "Content-Type": "application/json" };

    if (selectedModel === "llama-3.3-70b-versatile") {
      apiKey = process.env.OPEN_AI || "";
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      requestBody = {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "You are NxtAI. Be concise and helpful." }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      };
    } else if (selectedModel === "openrouter") {
      apiKey = process.env.OPEN_ROUTER || "";
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "http://localhost:3000"; // Optional but recommended by openrouter
      headers["X-Title"] = "NxtAi";
      requestBody = {
        model: "google/gemma-2-9b-it:free", // Default free model
        messages: [{ role: "system", content: "You are NxtAI. Be concise." }, ...messages],
      };
    } else if (selectedModel === "deepseek") {
      apiKey = process.env.DEEP_SEEK_API || "";
      apiUrl = "https://api.deepseek.com/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      requestBody = {
        model: "deepseek-chat",
        messages: [{ role: "system", content: "You are NxtAI. Be concise." }, ...messages],
      };
    } else {
      return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: `API key for model ${selectedModel} is not configured` }, { status: 500 });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || err.message || `Request to ${selectedModel} failed` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
