import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topic, messages } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || "";
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = req.cookies.get("token")?.value;

    // ✅ Build context from chat messages if available
    let chatContext = "";
    if (messages && Array.isArray(messages) && messages.length > 0) {
      chatContext = messages
        .filter(
          (m: any) =>
            // Skip image/pdf/video messages
            !m.content.startsWith("[image") &&
            !m.content.startsWith("[pdf") &&
            !m.content.startsWith("![video") &&
            !m.content.startsWith("[pdf-ready"),
        )
        .map(
          (m: any) =>
            `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
        )
        .join("\n\n");
    }

    const systemPrompt = `You are a professional document writer. Generate well-structured document content.
Format rules:
- Use ## for main section headings
- Use - for bullet points  
- Separate sections with blank lines
- Be detailed and professional
- Return ONLY the content, no meta commentary`;

    const userPrompt = chatContext
      ? `Create a professional PDF document based on this chat conversation.
Topic/Title: ${topic}

Chat conversation to document:
${chatContext}

Instructions:
- Summarize and organize the conversation into a well-structured document
- Include all key information, code snippets, and decisions from the chat
- Add an Introduction and Conclusion
- Format code examples properly`
      : `Write a detailed professional document about: ${topic}`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Send to Express to build the PDF
    const pdfRes = await fetch(`${backendUrl}/api/generate/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ title: topic, content, topic }),
    });

    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: "PDF generation failed" },
        { status: 500 },
      );
    }

    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${topic.slice(0, 30).replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
