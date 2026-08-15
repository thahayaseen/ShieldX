import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleGenAI } from "npm:@google/genai";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "npm:@modelcontextprotocol/sdk/client/sse.js";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

// The URL of your VPS running the MCP Server. 
// Fallback to localhost for local testing.
const MCP_SERVER_URL = Deno.env.get("MCP_SERVER_URL") || "http://host.docker.internal:3000/mcp/sse";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let mcpTransport: SSEClientTransport | null = null;

  try {
    // Read the request body as JSON (expecting base64 audio and mimeType)
    const { audio, mimeType = "audio/mp3" } = await req.json();

    if (!audio) {
      throw new Error("Missing audio data in request body.");
    }

    console.log(`Connecting to remote MCP Server at ${MCP_SERVER_URL}...`);
    mcpTransport = new SSEClientTransport(new URL(MCP_SERVER_URL));
    const mcpClient = new Client({ name: "voice-agent", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(mcpTransport);
    console.log("Connected to MCP Server!");

    // Dynamically fetch all tools from the remote VPS server
    const { tools: mcpTools } = await mcpClient.listTools();
    
    // Map MCP tool schema to Gemini tool schema
    const geminiTools = mcpTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as any,
    }));

    const prompt = "Listen to the user's voice request and answer them. Use your tools if necessary.";
    
    console.log("Sending audio to Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: mimeType, data: audio } },
            { text: prompt },
          ],
        },
      ],
      config: {
        tools: [{ functionDeclarations: geminiTools }],
      },
    });

    let finalResponseText = response.text;

    // Check if Gemini wanted to call a tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      console.log(`Gemini requested tool execution: ${call.name}`);
      
      // Execute the tool remotely on the VPS via MCP!
      const toolResult = await mcpClient.callTool({
        name: call.name,
        arguments: call.args as any,
      });

      console.log(`Tool ${call.name} executed successfully.`);

      // Send tool result back to Gemini for the final response
      const followUpResponse = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mimeType, data: audio } },
              { text: prompt },
            ],
          },
          {
            role: "model",
            parts: [{ functionCall: call }],
          },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult.content }, // Pass the MCP tool output back
                },
              },
            ],
          },
        ],
      });

      finalResponseText = followUpResponse.text;
    }

    if (mcpTransport) await mcpTransport.close();

    return new Response(JSON.stringify({ text: finalResponseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    if (mcpTransport) await mcpTransport.close();
    console.error("Voice Agent Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
