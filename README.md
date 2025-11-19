# GeminiFlow 🌊

**AI-Powered Flowchart & Diagram Generator**

GeminiFlow is a modern, intelligent diagramming tool that turns natural language descriptions into professional flowcharts instantly. Built with React, Vite, and the Google Gemini API.

![Version](https://img.shields.io/badge/version-1.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

- **✨ AI Generation**: Simply describe your process (e.g., "How to bake a cake"), and GeminiFlow generates a logical, structured flowchart.
- **🎨 Smart Layouts**:
  - **Top-Bottom**: Standard hierarchical tree view.
  - **Zig-Zag**: Snake-like layout for linear processes.
  - **Orthogonal Routing**: Clean, right-angled connections between nodes.
- **📱 Mobile Optimized (v1.3)**:
  - Fully responsive design with a collapsible sidebar.
  - **Touch Gestures**: Pinch-to-zoom and pan support on mobile/tablet.
  - **Double-Tap to Edit**: Quickly rename nodes on the fly.
  - Visual cues and animated hints for mobile users.
- **🎛️ Customization**:
  - **Verbosity Control**: Choose between Precise, Moderate, or Exhaustive labels.
  - **Node Density**: Adjust the complexity of the diagram (Aggressive, Moderate, Default).
- **mb Export Options**:
  - **PNG**: High-quality image export.
  - **A4 Print**: Auto-formatted for A4 paper (Portrait/Landscape).
  - **PowerPoint**: 16:9 aspect ratio for slides.
  - **Word**: Optimized for documents.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash (via `@google/genai` SDK)
- **Rendering**: SVG & HTML5 Canvas

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ompop-pro21/gemini-flow.git
   cd gemini-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🚀 Deployment

This project is ready for deployment on **Netlify** or **Render**.

### Netlify (Recommended)
1. Fork/Clone this repo.
2. Import into Netlify.
3. Set the Build Command to `npm run build` and Publish Directory to `dist`.
4. **Crucial**: Add your `API_KEY` in the Netlify "Environment Variables" settings.

## 📜 License

© 2025 Om Pophale. All rights reserved.
This project is licensed under the [MIT License](LICENSE).
