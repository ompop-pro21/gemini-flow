import { FlowchartData, FlowchartNode, LayoutDirection, NodeShape } from "../types";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;
const X_GAP = 60;
const Y_GAP = 100;
const CANVAS_PADDING = 50;
const SNAKE_COLUMNS = 4; // Increased columns to reduce height (wider zig-zag)

export const computeLayout = (data: FlowchartData, direction: LayoutDirection = LayoutDirection.TOP_BOTTOM): FlowchartData => {
  let { nodes, edges } = data;
  
  if (nodes.length === 0) return data;

  // --- SANITIZATION STEP ---
  // 1. Remove edges that point to non-existent nodes
  const nodeIds = new Set(nodes.map(n => n.id));
  edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  // 2. Remove self-loops
  edges = edges.filter(e => e.source !== e.target);

  // 3. Fix "Ghost" Edges from Decision Nodes
  // Decision nodes (Diamonds) MUST have labeled edges (Yes/No).
  // Sometimes the AI generates a redundant unlabeled edge along with the labeled ones.
  // We filter out unlabeled edges ONLY if the source is a Diamond node.
  const diamondNodeIds = new Set(nodes.filter(n => n.shape === NodeShape.DIAMOND).map(n => n.id));
  edges = edges.filter(e => {
    if (diamondNodeIds.has(e.source)) {
      // If source is a diamond, keep edge ONLY if it has a label
      return e.label && e.label.trim().length > 0;
    }
    return true;
  });
  
  // Update data with sanitized edges
  data.edges = edges;
  // -------------------------

  const nodeMap = new Map<string, FlowchartNode>();
  nodes.forEach(node => {
    node.level = 0;
    nodeMap.set(node.id, node);
  });

  // 1. Calculate Levels (BFS) to determine logical order
  // We try to find a root, or default to the first node
  const targets = new Set(edges.map(e => e.target));
  const startNodeId = nodes.find(n => !targets.has(n.id))?.id || nodes[0].id;

  const queue: { id: string, level: number }[] = [{ id: startNodeId, level: 0 }];
  const visited = new Set<string>();
  visited.add(startNodeId);

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      // We keep the maximum level found for a node to push it down to its latest dependency
      node.level = Math.max(node.level || 0, level);
    }

    // Find outgoing connections
    const outgoingEdges = edges.filter(e => e.source === id);
    outgoingEdges.forEach(edge => {
      // Prevent infinite loops in cyclic graphs by limiting depth revisits or just checking visited set for standard BFS
      // For layout purposes, if we hit a visited node, we might want to push it down if this path is longer,
      // but simple BFS is usually safer for general flowcharts to prevent infinite layout loops.
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push({ id: edge.target, level: level + 1 });
      } else {
        // Optional: If we want to handle "merge" points better, we could update the level here
        // but we must be careful of cycles.
        const targetNode = nodeMap.get(edge.target);
        if (targetNode && (targetNode.level || 0) < level + 1) {
             // Only update if it doesn't create a cycle? 
             // For now, simple BFS ordering is robust enough for zig-zag.
        }
      }
    });
  }

  // 2. Sort nodes to linearize the flow
  const sortedNodes = [...nodes].sort((a, b) => {
    const levA = a.level || 0;
    const levB = b.level || 0;
    if (levA !== levB) return levA - levB;
    return a.id.localeCompare(b.id);
  });

  // 3. Apply Layout based on direction
  if (direction === LayoutDirection.ZIG_ZAG) {
    // Apply Zig-Zag (Snake) Grid Layout
    // This reduces height by wrapping the flow horizontally
    sortedNodes.forEach((node, index) => {
      const row = Math.floor(index / SNAKE_COLUMNS);
      let col = index % SNAKE_COLUMNS;

      // Invert column order for odd rows to create the "Snake" pattern
      // Row 0: 0 -> 1 -> 2 -> 3
      // Row 1: 3 -> 2 -> 1 -> 0
      if (row % 2 !== 0) {
        col = SNAKE_COLUMNS - 1 - col;
      }

      node.x = col * (NODE_WIDTH + X_GAP) + CANVAS_PADDING + (NODE_WIDTH / 2);
      node.y = row * (NODE_HEIGHT + Y_GAP) + CANVAS_PADDING + (NODE_HEIGHT / 2);
    });
  } else {
    // Top-Bottom Layout (Standard Tree-like)
    // We group nodes by level and center them
    const levels = new Map<number, FlowchartNode[]>();
    let maxLevel = 0;
    
    sortedNodes.forEach(node => {
      const lvl = node.level || 0;
      if (!levels.has(lvl)) levels.set(lvl, []);
      levels.get(lvl)!.push(node);
      maxLevel = Math.max(maxLevel, lvl);
    });

    // Calculate max width to center everything
    let maxRowWidth = 0;
    levels.forEach(nodesInLevel => {
      maxRowWidth = Math.max(maxRowWidth, nodesInLevel.length * (NODE_WIDTH + X_GAP));
    });

    levels.forEach((nodesInLevel, level) => {
      const rowWidth = nodesInLevel.length * (NODE_WIDTH + X_GAP) - X_GAP;
      const startX = (maxRowWidth - rowWidth) / 2 + CANVAS_PADDING;
      
      nodesInLevel.forEach((node, index) => {
        node.x = startX + index * (NODE_WIDTH + X_GAP) + (NODE_WIDTH / 2);
        node.y = level * (NODE_HEIGHT + Y_GAP) + CANVAS_PADDING + (NODE_HEIGHT / 2);
      });
    });
  }

  return { nodes, edges };
};