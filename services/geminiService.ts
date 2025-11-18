import { GoogleGenAI, Schema, Type } from "@google/genai";
import { FlowchartData, Verbosity, NodeShape, NodeDensity } from "../types";

// Initialize the Gemini API client
// NOTE: In a real production app, you might proxy this through a backend to hide the key, 
// but for this SPA Blueprint implementation, we use the SDK directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFlowchart = async (
  prompt: string,
  verbosity: Verbosity,
  density: NodeDensity
): Promise<FlowchartData> => {
  
  const modelName = "gemini-2.5-flash";

  // robust schema definition as per blueprint recommendations
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        description: "List of nodes in the flowchart",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique identifier for the node (e.g., 'node1')" },
            label: { type: Type.STRING, description: "Text content of the node" },
            shape: { 
              type: Type.STRING, 
              enum: [NodeShape.RECTANGLE, NodeShape.DIAMOND, NodeShape.PILL, NodeShape.PARALLELOGRAM],
              description: "Visual shape of the node based on flowchart standards (pill=start/end, diamond=decision, rectangle=process)"
            }
          },
          required: ["id", "label", "shape"]
        }
      },
      edges: {
        type: Type.ARRAY,
        description: "List of connections between nodes",
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING, description: "ID of the source node" },
            target: { type: Type.STRING, description: "ID of the target node" },
            label: { type: Type.STRING, description: "Optional label for the connector (e.g., 'Yes', 'No')" }
          },
          required: ["source", "target"]
        }
      }
    },
    required: ["nodes", "edges"]
  };

  const systemPrompt = `
    You are GeminiFlow, an expert system designed to generate structured data for flowchart diagrams.
    Your task is to analyze the user's topic and create a logical, step-by-step flowchart.
    
    Rules:
    1. The flowchart must have a single logical starting point (shape: 'pill') and one or more ending points.
    2. Use 'rectangle' for process steps, 'diamond' for decisions, and 'parallelogram' for data input/output.
    3. Verbosity Level: ${verbosity}. 
       - If 'precise': Labels should be 2-5 words.
       - If 'moderate': Labels should be complete sentences.
       - If 'exhaustive': Labels can be detailed descriptions.
    4. Node Density: ${density}.
       - If 'aggressive': Use strictly as few nodes as possible. Combine steps where logical.
       - If 'moderate': Add necessary and moderate amount of nodes.
       - If 'default': Standard detailed breakdown of the process.
    5. Ensure all Node IDs are unique.
    6. Ensure all Edge 'source' and 'target' fields correspond to valid Node IDs.
    7. For decision nodes (diamond), ensure there are at least two outgoing edges with labels (e.g., "Yes", "No").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for consistent structural logic
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as FlowchartData;
      return data;
    }
    
    throw new Error("No content generated");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate flowchart. Please check your API key and try again.");
  }
};