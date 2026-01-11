:root {
  /* Material You Dark Theme Palette */
  --bg0: #121212;   /* Deepest black */
  --bg1: #1E1E1E;   /* Elevated surface */
  --card: #2C2C2C;  /* Card background */
  --primary: #D0BCFF; /* Soft purple (Material accent) */
  --on-primary: #381E72;
  --text: #E6E1E5;
  --muted: #938F99;
  --success: #81C784; /* Softer green */
  
  --radius: 16px; /* Android standard rounded corners */
  --font: 'Roboto', system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  font-family: var(--font); /* Goodbye Monospace */
  background-color: var(--bg0);
  color: var(--text);
  padding-bottom: 80px; /* Space for Bottom Nav */
}

/* Make the Top Bar cleaner */
.topbar {
  background: var(--bg1);
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  padding: 16px;
  border-bottom: none;
}

/* Material Design Cards */
.block, .card {
  background: var(--card);
  border: none; /* Remove harsh borders */
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2); /* Soft shadow depth */
}

/* Big, Finger-Friendly Checkboxes */
.chk {
  width: 32px;
  height: 32px;
  border-radius: 50%; /* Circles feel friendlier than squares */
  border: 2px solid var(--muted);
  transition: all 0.2s ease;
}

.chk.done {
  background: var(--success);
  border-color: var(--success);
  box-shadow: 0 0 10px rgba(129, 199, 132, 0.4); /* Glow effect */
}

/* Android Bottom Navigation Bar */
.tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: var(--bg1);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  z-index: 100;
  box-shadow: 0 -4px 10px rgba(0,0,0,0.3);
}

.tab {
  background: transparent;
  color: var(--muted);
  border: none;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 20px;
}

.tab.active {
  background: rgba(208, 188, 255, 0.2); /* Highlight pill */
  color: var(--primary);
}

/* Improve Typography Hierarchy */
h1, h2, h3, h4 {
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.item-title {
  font-size: 16px;
  font-weight: 400; /* Lighter weight looks cleaner */
}
