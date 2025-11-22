# Redmine Chat

A modern, chat-like interface for Redmine issue tracking system built with Next.js. Transform your Redmine workflow into an intuitive, collaborative experience similar to modern messaging applications.

## 🎯 Overview

Redmine Chat reimagines the traditional issue tracking experience by presenting Redmine issues as chat rooms. Each issue becomes a conversation thread where team members can discuss, update status, assign tasks, and track progress in real-time.

### Key Features

- 🗨️ **Chat-Style Interface**: Issues displayed as conversation threads with real-time updates
- 📝 **Rich Markdown Support**: Full GitHub Flavored Markdown with syntax highlighting
- 🔄 **Live Updates**: Automatic refresh of issue status and comments
- 👥 **User Management**: Easy assignment and user filtering
- 🏷️ **Issue Metadata**: Quick access to status, priority, tracker, and category
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🔐 **Secure Authentication**: API key-based authentication with proxy support
- ✏️ **Inline Editing**: Edit comments and issue details without leaving the chat
- 📊 **Project Organization**: Browse issues by project with smart filtering

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A Redmine instance with API access enabled
- Redmine API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/willysk73/redmine-chat.git
cd redmine-chat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

On first launch, you'll be prompted to enter:
- **Redmine URL**: Your Redmine instance URL (e.g., `https://redmine.example.com`)
- **API Key**: Your personal Redmine API key (found in your Redmine account settings)

These credentials are stored in your browser's local storage and used to authenticate all API requests through a secure proxy.

## 📖 Usage

### Navigating the Interface

1. **Project List**: Browse all available projects in the left sidebar
2. **Issue List**: View all issues for the selected project
3. **Chat Area**: Read and respond to issue discussions
4. **Issue Details**: View and edit metadata (status, priority, assignee, etc.)

### Creating Issues

Click the "New Issue" button and fill in:
- Subject (required)
- Description
- Tracker type
- Status
- Priority
- Assignee
- Category

### Updating Issues

- **Add Comments**: Type in the message input at the bottom of the chat
- **Edit Comments**: Click the edit icon on your own comments
- **Change Status**: Use the status dropdown in the issue details panel
- **Reassign**: Select a new assignee from the dropdown
- **Update Priority**: Change priority level as needed

### Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Lucide icons
- **Markdown**: react-markdown with remark-gfm and rehype-raw
- **Date Handling**: date-fns

### Project Structure

```
redmine-chat/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── proxy/         # Redmine API proxy
│   │   └── project/       # Project details endpoint
│   ├── login/             # Login page
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ChatArea.tsx       # Chat interface
│   ├── IssueList.tsx      # Issue list sidebar
│   ├── ProjectList.tsx    # Project list sidebar
│   └── CreateIssueModal.tsx # New issue modal
├── lib/                   # Utilities and API client
│   ├── redmine.ts         # Redmine API client
│   ├── context.tsx        # React context
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

### API Proxy

The application uses a Next.js API route (`/api/proxy`) to proxy all Redmine API requests. This approach:
- Prevents CORS issues
- Keeps API keys secure (not exposed in client-side code)
- Enables request/response transformation if needed

## 🔧 Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Markdown rendering by [react-markdown](https://github.com/remarkjs/react-markdown)
- Inspired by modern chat applications and the need for better Redmine UX

## 📧 Contact

Will Kang - willysk73@outlook.com

Project Link: [https://github.com/willysk73/redmine-chat](https://github.com/willysk73/redmine-chat)

---

**Note**: This is an independent project and is not officially affiliated with or endorsed by Redmine.
