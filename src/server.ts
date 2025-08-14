import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

// Import all tool definitions with the correct names
import { getAthleteProfile } from "./tools/getAthleteProfile.js";
import { getAthleteStatsTool } from "./tools/getAthleteStats.js";
import { getActivityDetailsTool } from "./tools/getActivityDetails.js";
import { getRecentActivities } from "./tools/getRecentActivities.js";
import { listAthleteClubs } from "./tools/listAthleteClubs.js";
import { listStarredSegments } from "./tools/listStarredSegments.js";
import { getSegmentTool } from "./tools/getSegment.js";
import { exploreSegments } from "./tools/exploreSegments.js";
import { starSegment } from "./tools/starSegment.js";
import { getSegmentEffortTool } from "./tools/getSegmentEffort.js";
import { listSegmentEffortsTool } from "./tools/listSegmentEfforts.js";
import { listAthleteRoutesTool } from "./tools/listAthleteRoutes.js";
import { getRouteTool } from "./tools/getRoute.js";
import { exportRouteGpx } from "./tools/exportRouteGpx.js";
import { exportRouteTcx } from "./tools/exportRouteTcx.js";
import { getActivityStreamsTool } from "./tools/getActivityStreams.js";
import { getActivityLapsTool } from "./tools/getActivityLaps.js";
import { getAthleteZonesTool } from "./tools/getAthleteZones.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";

// Import the actual client function
// import {
//     // exportRouteGpx as exportRouteGpxClient, // Removed unused alias
//     // exportRouteTcx as exportRouteTcxClient, // Removed unused alias
//     getActivityLaps as getActivityLapsClient
// } from './stravaClient.js';

// Load .env file explicitly from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
// REMOVE THIS DEBUG LOG - Interferes with MCP Stdio transport
// console.log(`[DEBUG] Attempting to load .env file from: ${envPath}`);
dotenv.config({ path: envPath });

function setupServer() {
  const server = new McpServer({
    name: "PAU's Strava MCP Server",
    version: "0.0.1",
  });

  // Register all tools using server.tool and the correct imported objects
  server.tool(
    getAthleteProfile.name,
    getAthleteProfile.description,
    {},
    getAthleteProfile.execute,
  );
  server.tool(
    getAthleteStatsTool.name,
    getAthleteStatsTool.description,
    getAthleteStatsTool.inputSchema?.shape ?? {},
    getAthleteStatsTool.execute,
  );
  server.tool(
    getActivityDetailsTool.name,
    getActivityDetailsTool.description,
    getActivityDetailsTool.inputSchema?.shape ?? {},
    getActivityDetailsTool.execute,
  );
  server.tool(
    getRecentActivities.name,
    getRecentActivities.description,
    getRecentActivities.inputSchema?.shape ?? {},
    getRecentActivities.execute,
  );
  server.tool(
    listAthleteClubs.name,
    listAthleteClubs.description,
    {},
    listAthleteClubs.execute,
  );
  server.tool(
    listStarredSegments.name,
    listStarredSegments.description,
    {},
    listStarredSegments.execute,
  );
  server.tool(
    getSegmentTool.name,
    getSegmentTool.description,
    getSegmentTool.inputSchema?.shape ?? {},
    getSegmentTool.execute,
  );
  server.tool(
    exploreSegments.name,
    exploreSegments.description,
    exploreSegments.inputSchema?.shape ?? {},
    exploreSegments.execute,
  );
  server.tool(
    starSegment.name,
    starSegment.description,
    starSegment.inputSchema?.shape ?? {},
    starSegment.execute,
  );
  server.tool(
    getSegmentEffortTool.name,
    getSegmentEffortTool.description,
    getSegmentEffortTool.inputSchema?.shape ?? {},
    getSegmentEffortTool.execute,
  );
  server.tool(
    listSegmentEffortsTool.name,
    listSegmentEffortsTool.description,
    listSegmentEffortsTool.inputSchema?.shape ?? {},
    listSegmentEffortsTool.execute,
  );
  server.tool(
    listAthleteRoutesTool.name,
    listAthleteRoutesTool.description,
    listAthleteRoutesTool.inputSchema?.shape ?? {},
    listAthleteRoutesTool.execute,
  );
  server.tool(
    getRouteTool.name,
    getRouteTool.description,
    getRouteTool.inputSchema?.shape ?? {},
    getRouteTool.execute,
  );
  server.tool(
    exportRouteGpx.name,
    exportRouteGpx.description,
    exportRouteGpx.inputSchema?.shape ?? {},
    exportRouteGpx.execute,
  );
  server.tool(
    exportRouteTcx.name,
    exportRouteTcx.description,
    exportRouteTcx.inputSchema?.shape ?? {},
    exportRouteTcx.execute,
  );
  server.tool(
    getActivityStreamsTool.name,
    getActivityStreamsTool.description,
    getActivityStreamsTool.inputSchema?.shape ?? {},
    getActivityStreamsTool.execute,
  );

  // --- Register get-activity-laps tool (Simplified) ---
  server.tool(
    getActivityLapsTool.name,
    getActivityLapsTool.description,
    getActivityLapsTool.inputSchema?.shape ?? {},
    getActivityLapsTool.execute,
  );

  // --- Register get-athlete-zones tool ---
  server.tool(
    getAthleteZonesTool.name,
    getAthleteZonesTool.description,
    getAthleteZonesTool.inputSchema?.shape ?? {},
    getAthleteZonesTool.execute,
  );
  return server;
}

// --- Helper Functions ---
// Moving formatDuration to utils or keeping it here if broadly used.
// For now, it's imported by getActivityLaps.ts
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "N/A";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(hours.toString().padStart(2, "0"));
  }
  parts.push(minutes.toString().padStart(2, "0"));
  parts.push(secs.toString().padStart(2, "0"));

  return parts.join(":");
}

// Removed other formatters - they are now local to their respective tools.

// --- Server Startup ---
async function startServerStdio() {
  try {
    console.error("Starting Strava MCP Server...");
    const transport = new StdioServerTransport();
    const server = setupServer();
    await server.connect(transport);
    console.error(`Strava MCP Server connected via Stdio. Tools registered.`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function startServerHttp() {
  const server = setupServer();
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: "*", // Configure appropriately for production, for example:
      // origin: ['https://your-remote-domain.com', 'https://your-other-remote-domain.com'],
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: ["Content-Type", "mcp-session-id"],
    }),
  );

  // Map to store transports by session ID
  const transports = {
    streamable: {} as Record<string, StreamableHTTPServerTransport>,
    sse: {} as Record<string, SSEServerTransport>,
  };

  // Modern Streamable HTTP endpoint
  app.all("/mcp", async (req, res) => {
    console.error("Received request");
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.streamable[sessionId]) {
      // Reuse existing transport
      console.error("Reusing existing transport:", sessionId);
      transport = transports.streamable[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      console.error("New initialization request");
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID
          transports.streamable[sessionId] = transport;
        },
        // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
        // locally, make sure to set:
        // enableDnsRebindingProtection: true,
        // allowedHosts: ['127.0.0.1'],
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports.streamable[transport.sessionId];
        }
      };

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  });

  // Legacy SSE endpoint for older clients
  app.get("/sse", async (_, res) => {
    // Create SSE transport for legacy clients
    const transport = new SSEServerTransport("/messages", res);
    transports.sse[transport.sessionId] = transport;

    res.on("close", () => {
      delete transports.sse[transport.sessionId];
    });

    await server.connect(transport);
  });

  // Legacy message endpoint for older clients
  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.sse[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  app.listen(process.env.PORT || 3000, () => {
    console.error(
      `Strava MCP Server listening on port ${process.env.PORT || 3000}`,
    );
  });
}

if (process.env.TRANSPORT === "stdio") {
  startServerStdio();
} else {
  startServerHttp();
}
