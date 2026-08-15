import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleGenAI } from "npm:@google/genai";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "npm:@modelcontextprotocol/sdk/client/sse.js";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

// The URL of your VPS running the MCP Server. 
const MCP_SERVER_URL = Deno.env.get("MCP_SERVER_URL") || "http://host.docker.internal:3000/mcp/sse";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let mcpTransport: SSEClientTransport | null = null;

  try {
    const body = await req.json();
    const { mission_id, incident_id } = body;

    if (!mission_id && !incident_id) {
      throw new Error("Missing mission_id or incident_id in request body.");
    }

    const targetStr = mission_id ? `Mission ID: ${mission_id}` : `Incident ID: ${incident_id}`;
    console.log(`Connecting to remote MCP Server at ${MCP_SERVER_URL}...`);
    
    mcpTransport = new SSEClientTransport(new URL(MCP_SERVER_URL));
    const mcpClient = new Client({ name: "auto-assign", version: "1.0.0" }, { capabilities: {} });
    
    try {
      await mcpClient.connect(mcpTransport);
      console.log("Connected to MCP Server!");
    } catch (connError: any) {
      throw new Error(`Failed to connect to remote MCP Server at ${MCP_SERVER_URL}: ${connError.message}`);
    }

    // Dynamically fetch all tools from the remote VPS server
    const { tools: mcpTools } = await mcpClient.listTools();
    
    // Map MCP tool schema to Gemini tool schema
    const geminiTools = mcpTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as any,
    }));

    const systemPrompt = `You are A.E.G.I.S. Auto-Dispatch AI.
Your task is to assign the best available hero to the following emergency: ${targetStr}.

Instructions:
1. Fetch the details of the mission or incident to understand the required powers and priority.
2. Fetch the available heroes (using get_hero_status or similar) to see who is online and matches the required powers.
3. Call the 'assign_mission' tool to dispatch the hero (if it's an incident, create a mission first using 'create_mission').
4. Once you have successfully assigned a hero, respond with a final text summary of who you assigned and why.

CRITICAL: You are running in an autonomous loop. You MUST use your tools to accomplish this task. DO NOT ask the user for permission. Just do it and respond with a final text summary when complete.`;

    const requestContents: any[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      }
    ];

    let finalResponseText = "No final response generated.";
    
    // Auto-Agent Loop (max 10 iterations)
    for (let turn = 0; turn < 10; turn++) {
      console.log(`[Turn ${turn + 1}] Calling Gemini...`);
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: requestContents,
        config: {
          tools: [{ functionDeclarations: geminiTools }],
        },
      });

      // Echo model's response back to history to preserve thought_signature
      requestContents.push(response.candidates[0].content);

      // Check if Gemini wanted to call a tool
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        console.log(`[Turn ${turn + 1}] Gemini called tool: ${call.name} with args:`, call.args);
        
        let toolResultText = "";
        try {
          const toolResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args as any,
          });
          toolResultText = JSON.stringify(toolResult.content);
          console.log(`[Turn ${turn + 1}] Tool ${call.name} executed successfully.`);
        } catch (toolErr: any) {
          toolResultText = `Error executing tool: ${toolErr.message}`;
          console.error(`[Turn ${turn + 1}] ${toolResultText}`);
        }

        // Add tool result to conversation history
        requestContents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: { result: toolResultText },
              },
            },
          ],
        });
      } else {
        // No tool called, agent returned final text response
        finalResponseText = response.text;
        console.log("Agent provided final text response. Loop complete.");
        break;
      }
    }

    if (mcpTransport) await mcpTransport.close();

    return new Response(JSON.stringify({ success: true, text: finalResponseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    if (mcpTransport) await mcpTransport.close();
    console.error("Auto-Assign Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
