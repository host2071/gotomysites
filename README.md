# Go My Sites

A web application for quick access to your favorite websites using keywords. Type a keyword in the search bar to instantly navigate to any site, or add a search query to search directly on that site.

## Getting Started

### Using the Application

**Basic Navigation:**
1. Enter a keyword in the search bar (e.g., `youtube`) and press Enter to go directly to that website
2. Type a keyword followed by a search query (e.g., `youtube react tutorial`) to search on that site
3. Click on any site icon in the grid on the home page for instant access

**Search Suggestions:**
- When you focus on the empty search bar, popular sites are displayed
- As you type, suggestions appear automatically based on your saved keywords
- Use arrow keys to navigate suggestions, Enter to select, or click with your mouse
- Selected suggestions are added to the search bar with a space after them

**Keyboard Shortcuts:**
- `Arrow Up/Down` - Navigate through suggestions
- `Enter` - Select a suggestion or perform search
- `Escape` - Close suggestions

**Managing Your Sites:**
1. Click the settings icon (⚙️) in the top right corner
2. In the settings page, you can:
   - Add new websites with custom keywords
   - Remove websites you no longer need
   - View all your saved sites in a list
   - Reorder sites by dragging them

### Setting Up Authentication

**Creating an Account:**
1. Click "Login" or "Register" in the header
2. Create an account using email/password or sign in with Google
3. Once authenticated, your data will automatically sync across devices

**Benefits of Authentication:**
- Your keywords and sites are saved in the cloud
- Access your settings from any device
- Popular sites are displayed based on your usage
- Your data is automatically backed up

**Managing Your Account:**
- Access account settings from the Settings page
- Log out from the Settings page using the logout button
- When you log out, local storage resets to default settings

## Learn More

### How It Works

**Keyword Search:**
The application parses your input to separate the keyword from the search query. The first word is treated as the keyword (the site you want to visit), and everything after the first space becomes the search query.

**Search Logic:**
- First, the app looks for an exact keyword match
- If no exact match is found and your keyword is longer than 3 characters, it performs fuzzy matching by checking if keywords start with your input, contain it, or match in descriptions
- If no match is found, it uses the default search engine

**Suggestions:**
- When the search bar is empty and focused, popular sites are shown (for authenticated users) or all your saved keywords (for non-authenticated users)
- When typing, suggestions are filtered to show matching keywords
- Suggestions help you quickly find and select keywords without typing them completely

**Data Storage:**
- Without authentication: Your data is stored locally in your browser
- With authentication: Your data is synced to the cloud and accessible from any device

### Tips for Best Experience

- Use short and memorable keywords for your favorite sites
- Add descriptions to sites to make them easier to find
- Take advantage of autocomplete suggestions for faster navigation
- Click site icons on the home page for instant access
- Keep your most-used sites at the top for quick access
