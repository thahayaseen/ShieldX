import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';

import { getHeroStatus } from './tools/heroes.js';
import { getActiveMissions, getHeroAssignment } from './tools/missions.js';
import { getBreakingIncidents } from './tools/incidents.js';
import { getSystemOverview } from './tools/system.js';
import { analyzeIncident } from './ai/gemini.js';

// Define the tools
const TOOLS = {
  get_hero_status: {
    name: 'get_hero_status',
    description: 'Get current status of a specific hero or all heroes.',
    inputSchema: {
      type: 'object',
      properties: {
        hero_name: { type: 'string', description: 'Name of specific hero (optional)' }
      }
    }
  },
  get_active_missions: {
    name: 'get_active_missions',
    description: 'Retrieve all currently active missions.',
    inputSchema: {
      type: 'object',
      properties: {
        priority: { type: 'string', description: 'Filter by priority level (low, medium, high, critical) (optional)' }
      }
    }
  },
  get_hero_assignment: {
    name: 'get_hero_assignment',
    description: 'Get hero assignment for a specific mission.',
    inputSchema: {
      type: 'object',
      properties: {
        mission_id: { type: 'string', description: 'Specific mission ID (optional)' }
      }
    }
  },
  get_breaking_incidents: {
    name: 'get_breaking_incidents',
    description: 'Retrieve recent or breaking emergency incidents.',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: { type: 'number', description: 'Time range in minutes (default 60)' }
      }
    }
  },
  get_system_overview: {
    name: 'get_system_overview',
    description: 'Get complete system status overview.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  analyze_incident: {
    name: 'analyze_incident',
    description: 'Use AI to analyze an incident and determine required hero capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        incident_details: { type: 'string', description: 'Detailed description of the incident' }
      },
      required: ['incident_details']
    }
  }
};

const server = new Server(
  {
    name: 'aegis-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Tool List
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(TOOLS)
  };
});

// Register Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result: any;
    
    switch (name) {
      case 'get_hero_status': {
        const schema = z.object({ hero_name: z.string().optional() });
        const { hero_name } = schema.parse(args || {});
        result = await getHeroStatus(hero_name);
        break;
      }
      
      case 'get_active_missions': {
        const schema = z.object({ priority: z.string().optional() });
        const { priority } = schema.parse(args || {});
        result = await getActiveMissions(priority);
        break;
      }
      
      case 'get_hero_assignment': {
        const schema = z.object({ mission_id: z.string().optional() });
        const { mission_id } = schema.parse(args || {});
        result = await getHeroAssignment(mission_id);
        break;
      }
      
      case 'get_breaking_incidents': {
        const schema = z.object({ time_range: z.number().optional() });
        const { time_range } = schema.parse(args || {});
        result = await getBreakingIncidents(time_range);
        break;
      }
      
      case 'get_system_overview': {
        result = await getSystemOverview();
        break;
      }
      
      case 'analyze_incident': {
        const schema = z.object({ incident_details: z.string() });
        const { incident_details } = schema.parse(args);
        result = await analyzeIncident(incident_details);
        break;
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const app = express();
  app.use(cors());
  
  let transport: SSEServerTransport;

  app.get('/mcp/sse', async (req, res) => {
    console.log('New SSE connection established');
    transport = new SSEServerTransport('/mcp/messages', res as any);
    await server.connect(transport);
  });

  app.post('/mcp/messages', async (req, res) => {
    if (!transport) {
      res.status(400).send('SSE Connection not established yet');
      return;
    }
    await transport.handlePostMessage(req, res as any);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`A.E.G.I.S. MCP Server running on SSE at http://localhost:${PORT}/mcp/sse`);
  });
}

main().catch(console.error);
