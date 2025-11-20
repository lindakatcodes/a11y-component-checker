# A11y Component Checker

An AI-powered accessibility checker that uses Google's Gemini API to analyze component code for common accessibility errors and provide instructive, actionable corrections.

View the live app at https://a11y-component-checker.netlify.app/

## What It Does

This tool helps developers improve the accessibility of their web components by:
- Analyzing component code for WCAG compliance issues
- Identifying common a11y anti-patterns
- Providing clear, educational explanations of accessibility problems
- Offering specific code corrections and best practices
- Provides starter examples and can analyze code for Vue, React, and Angular components

Unlike static linters, this tool leverages Gemini's language understanding to provide contextual, human-readable feedback that helps you learn accessibility principles while fixing issues.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend build tool
- **TypeScript** - Type-safe JavaScript
- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **Google Gemini API** - AI-powered code analysis

## Prerequisites

- Node.js (v20 or higher recommended)
- npm or your preferred package manager
- A Google Gemini API key ([Get one from Google's AI Studio](https://aistudio.google.com/app/apikey))

## Getting Started Locally

### Installation

```bash
# Clone the repository
git clone https://github.com/lindakatcodes/a11y-component-checker.git
cd a11y-component-checker

# Install dependencies
npm install
```

### Configuration

The only environment variable is an encryption key that the serverless function will use to encrypt a user's Gemini API key. You can generate this on a Windows Subsystem for Linux terminal with the below command, or using a site like https://generate-random.org/encryption-keys to create a random string of hexadecimal characters the right length. 

```sh
openssl rand -base64 32
```

Then store that generated key in your `.env` file. 

```env
ENCRYPTION_KEY=your_generated_key
```

## Available Commands

### Development

Start the frontend development server with hot-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

The serverless endpoint functions for this site make use of Netlify's functions, so to run a version of the site locally that can actually use those endpoints, you'll want to have the [Netlify CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/) and run the following command: 

```bash
netlify dev
```

That will setup a local environment to simulate the production environment, giving you access to the serverless functions.

### Build

Create a production-ready build:

```bash
npm run build
```

The optimized files will be output to the `dist/` directory.

### Testing

Run unit tests with Vitest:

```bash
npm run test:unit
```

### Linting

Check and fix code style issues:

```bash
npm run lint
```

## Acknowledgments

Powered by Google's Gemini API for intelligent accessibility analysis.
A large portion of this application was generated with help from [Goose](https://block.github.io/goose/docs/quickstart) and [Gemini Code Assist for VSCode](https://marketplace.visualstudio.com/items?itemName=Google.geminicodeassist). If you notice any issues or have suggestions for improvements, please create an issue and let me know!

---

**Note**: This tool is designed to supplement, not replace, manual accessibility testing and human judgment. Always test your applications with real assistive technologies and diverse users.
