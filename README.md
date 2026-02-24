# Maze Delivery Blog

AI-augmented consulting delivery — articles, frameworks, and working demos.

Built with [Astro](https://astro.build) + React, deployed to GitHub Pages.

---

## Setup Guide (macOS + VS Code)

### Prerequisites

You need two things installed: **Node.js** and **Git**. If you're unsure whether you have them:

```bash
# Open Terminal (Cmd + Space, type "Terminal")
node --version    # Should show v18+ (e.g., v20.11.0)
git --version     # Should show any version
```

**If Node.js is missing**, install it:
1. Go to https://nodejs.org
2. Download the LTS version (green button)
3. Run the installer

**If Git is missing**, macOS will prompt you to install Xcode Command Line Tools when you first run `git`. Just follow the prompt.

---

### Step 1: Create the GitHub Repository

1. Go to https://github.com/new
2. Repository name: `maze-delivery-blog`
3. Set to **Public** (required for free GitHub Pages)
4. **Don't** initialise with README (we already have files)
5. Click **Create repository**
6. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/maze-delivery-blog.git`)

---

### Step 2: Get the Project Files onto Your Mac

If I've provided the project as a download, unzip it and open Terminal:

```bash
cd ~/Desktop/maze-delivery-blog    # or wherever you unzipped it
```

If starting from scratch, create the folder and add the files.

---

### Step 3: Update the Config

Open `astro.config.mjs` in VS Code and replace `YOUR_GITHUB_USERNAME`:

```javascript
site: 'https://YOUR_GITHUB_USERNAME.github.io',
```

Also update the About page (`src/pages/about/index.astro`) with your LinkedIn URL.

---

### Step 4: Test Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:4321/maze-delivery-blog/ in your browser. You should see the site with the article index, the first article with the interactive data model, and the demos page.

Press `Ctrl + C` in Terminal to stop the server.

---

### Step 5: Push to GitHub

```bash
# Initialise Git
git init
git add .
git commit -m "Initial site with delivery data model article"

# Connect to GitHub (use YOUR URL from Step 1)
git remote add origin https://github.com/YOUR_USERNAME/maze-delivery-blog.git
git branch -M main
git push -u origin main
```

VS Code may prompt you to sign in to GitHub — follow the browser auth flow.

---

### Step 6: Enable GitHub Pages

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/maze-delivery-blog`
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select **GitHub Actions**
4. That's it — the workflow file we included (`.github/workflows/deploy.yml`) handles the rest

The first deploy will trigger automatically from your push. Wait 1-2 minutes, then visit:

```
https://YOUR_GITHUB_USERNAME.github.io/maze-delivery-blog/
```

---

## Day-to-Day Workflow

### Adding a New Article

1. Create a new folder under `src/pages/articles/`:
   ```
   src/pages/articles/your-article-slug/index.astro
   ```
2. Use the first article as a template for the structure
3. Add the article to the grid in `src/pages/index.astro`
4. To add interactive components, create them in `src/components/` and import with `client:load`

### Deploying Changes

```bash
git add .
git commit -m "Add new article: your article title"
git push
```

GitHub Actions will automatically build and deploy. Takes about 60-90 seconds.

### Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server (http://localhost:4321) |
| `npm run build` | Build the production site to `./dist` |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
maze-delivery-blog/
├── .github/workflows/deploy.yml   ← Auto-deploys on push to main
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── DeliveryDataModel.jsx  ← Interactive React components
│   ├── layouts/
│   │   └── BaseLayout.astro       ← Shared page layout
│   ├── pages/
│   │   ├── index.astro            ← Home / article index
│   │   ├── articles/
│   │   │   └── four-systems-no-single-truth/
│   │   │       └── index.astro    ← First article
│   │   ├── demos/
│   │   │   └── index.astro        ← Live demos page
│   │   └── about/
│   │       └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Custom Domain (Optional)

If you want to use a custom domain like `delivery.maze.com.au`:

1. In your DNS provider, add a CNAME record pointing to `YOUR_USERNAME.github.io`
2. In GitHub repo Settings → Pages → Custom domain, enter your domain
3. Update `site` in `astro.config.mjs` to your custom domain
4. Remove the `base` line (no longer needed with a custom domain)
