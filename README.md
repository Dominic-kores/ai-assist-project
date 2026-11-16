# AI Writing Assistant

A full-stack app that generates blog posts, emails and social media content with AI, then lets you refine the result through a chat and save it as a draft.

Built with React + Vite on the frontend and Express + SQLite on the backend. It supports both **Anthropic (Claude)** and **OpenAI** as model providers.

## Features

- **Content generation**: choose a content type (blog post, email, social post), a tone (formal, casual, persuasive) and a length (short, medium, long).
- **Conversational refinement**: ask follow-ups like "make it shorter" or "add a call to action"; the full conversation history is sent so the model revises its earlier output.
- **Saved drafts**: store generated content in SQLite, then browse, preview and delete it.
- **Export**: download content as Markdown or copy it to the clipboard.
- **Usage info**: each result shows the provider and token count.
- **Light and dark mode**: the UI follows your system setting.

## Project structure

```
ai-assist/
├── client/                 # React + Vite frontend
│   ├── index.html
│   └── src/
│       ├── App.jsx         # Tabs, API calls, app state
│       ├── App.css         # Layout and component styles
│       ├── index.css       # Design tokens, base and form styles
│       └── components/
│           ├── GenerateForm.jsx    # Topic, type, tone, length inputs
│           ├── ContentDisplay.jsx  # Output, save/export/copy actions
│           ├── ChatPanel.jsx       # Refinement chat
│           └── DraftList.jsx       # Saved drafts list and preview
└── server/                 # Express API
    ├── server.js           # Routes
    ├── llm.js              # Anthropic / OpenAI wrapper
    ├── prompts.js          # System prompts, tone and length config
    └── db.js               # SQLite schema and queries
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- An API key for Anthropic and/or OpenAI

### 1. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
DEFAULT_LLM_PROVIDER=anthropic   # or "openai"
PORT=3001
```

You only need the key for the provider you plan to use. Then start the API:

```bash
npm run dev     # with auto-reload (nodemon)
# or
npm start
```

The API runs at `http://localhost:3001`. The SQLite database (`writing-assistant.db`) is created automatically on first run.

### 2. Set up the client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

> The client calls the API at `http://localhost:3001`, so keep `PORT=3001` unless you also update the URLs in `client/src/App.jsx` and `client/src/components/DraftList.jsx`.

## API reference

| Method   | Endpoint           | Description                                  |
| -------- | ------------------ | -------------------------------------------- |
| `GET`    | `/api/health`      | Health check                                 |
| `POST`   | `/api/generate`    | Generate new content                         |
| `POST`   | `/api/chat`        | Refine content in an existing conversation   |
| `GET`    | `/api/drafts`      | List all drafts (newest first)               |
| `GET`    | `/api/drafts/:id`  | Get a single draft                           |
| `POST`   | `/api/drafts`      | Save a draft                                 |
| `PATCH`  | `/api/drafts/:id`  | Update a draft's content                     |
| `DELETE` | `/api/drafts/:id`  | Delete a draft                               |

### `POST /api/generate`

```json
{
  "topic": "Benefits of mobile banking for small businesses",
  "contentType": "blog",
  "tone": "casual",
  "length": "medium",
  "provider": "anthropic"
}
```

- `topic` is required.
- `contentType`: `blog` | `email` | `social` (default `blog`)
- `tone`: `formal` | `casual` | `persuasive` (default `casual`)
- `length`: `short` (150–250 words) | `medium` (400–600) | `long` (800–1200) (default `medium`)
- `provider`: `anthropic` | `openai` (optional; defaults to `DEFAULT_LLM_PROVIDER`)

Response:

```json
{
  "content": "...",
  "conversationId": "uuid",
  "provider": "anthropic",
  "model": "claude-haiku-5-5",
  "usage": { "input": 210, "output": 640, "total": 850 },
  "finished": true
}
```

### `POST /api/chat`

```json
{ "conversationId": "uuid-from-generate", "message": "Make it more concise" }
```

It returns the complete revised content in the same shape as `/api/generate`.

## Configuration

| Setting            | Where                | Default            |
| ------------------ | -------------------- | ------------------ |
| Default provider   | `DEFAULT_LLM_PROVIDER` | `anthropic`      |
| Anthropic model    | `server/llm.js`      | `claude-haiku-5-5` |
| OpenAI model       | `server/llm.js`      | `gpt-4o`           |
| Temperature        | `server/server.js`   | `0.7`              |
| Max tokens per length | `server/prompts.js` | 500 / 1000 / 2000 |

The prompts in `server/prompts.js` lean toward Kenyan and East African context for blog and social content. Edit them there to target a different audience.

## Tech stack

- **Frontend:** React 19, Vite
- **Backend:** Node.js, Express 5
- **Database:** SQLite via `better-sqlite3`
- **AI:** `@anthropic-ai/sdk`, `openai`

