# SheLaunch AI

Agentic startup copilot for women entrepreneurs. Generates a structured plan (Blueprint, Funding, GTM, Roadmap, Pitch) from a simple intake form, with JSON validation and export options.

## Features
- Five agents: Vision/Blueprint, Funding, GTM, Roadmap, Pitch Deck
- Robust JSON parsing with `MiniMax` client fixes (no truncation)
- Parallel agent execution for lower latency
- Exports: Copy JSON, Download Markdown, Download PPTX (stage-aware)
- Health check API and clean, minimal UI

## Quick Start
1. Install deps:
   ```bash
   npm install
   ```
2. Configure env:
   - Create a `.env.local` and set your MiniMax API key (and optional group/model):
     ```bash
     MINIMAX_API_KEY=your_key_here
     # Optional
     # MINIMAX_GROUP_ID=your_group
     # MINIMAX_BASE_URL=https://api.minimax.io/v1
     # MINIMAX_MODEL=MiniMax-M2.5
     ```
3. Run the dev server:
   ```bash
   npm run dev
   # If port 3000 is busy, Next will try 3001/3002 automatically
   # Or force a port:
   npx next dev -p 3000
   ```
4. Open the app:
   - Browser: http://localhost:3000 (or the port shown)
   - Fill the form and click "Generate Plan".

## API
- Health: `GET /api/health`
- Run Agents: `POST /api/runAgents`
  - Body (example):
    ```json
    {
      "founderName": "DEMO",
      "idea": "AI video ad generator for DTC brands to scale creative testing",
      "targetCustomer": "DTC brands and performance marketers",
      "stage": "ideation",
      "region": "California",
      "industry": "Marketing tech",
      "goals": "Validate demand; 10 pilot users; first paid logo",
      "constraints": "Solo founder, $2k budget, part-time",
      "challenge": "Finding 5 design partners"
    }
    ```

## Exports
- Copy JSON: copies validated `FinalResponse` to clipboard.
- Download Markdown: saves a clean plan document with clear sections.
- Download PPTX: generates a stage-labeled pitch deck using `pptxgenjs`.

## Demo Ideas
- AI Video Ad Generator for DTC brands
- AI UGC Video Maker for Shopify stores
- AI Creative Variant Engine for agencies
- AI Campaign Storyboarder for marketing teams

## Notes
- JSON integrity: `lib/minimax.ts` sets `max_tokens`, `response_format: json_object`, and extracts JSON reliably.
- Performance: `app/api/runAgents/route.ts` runs agents in parallel via `Promise.all`.
- If API status shows error, verify `MINIMAX_API_KEY` and restart dev.

## License
Proprietary – do not distribute.
