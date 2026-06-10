# 💎 ClientAxis CRM — Enterprise Lead & Pipeline Manager

ClientAxis is a premium, high-performance Customer Relationship Management (CRM) application designed for modern sales teams and client executives. Built with a sleek, luxury **Black & Gold design theme**, ClientAxis features real-time sales funnel visualization, interactive Kanban pipeline deal boards, a calendar task scheduler, executive data exports, and robust login portals including custom Google Sign-In.

---

## 🌟 Key Features

### 🌓 Luxury Design Theme (Black & Gold)
* **Dark Luxury Mode**: Styled as luxury financial software utilizing rich charcoal cards (`#1E1E28`), deep slate backdrops (`#0B0B0F`), and polished gold highlights (`#D4AF37`/`#F4D160`).
* **Light Luxury Mode**: A warm ivory and champagne gold theme (`#FAF8F5` base) featuring clean high-contrast elements, charcoal typography, and gold outlines.
* **Animated Radial Highlights**: Soft glowing amber/gold gradients in the body background to create a premium, glassmorphic visual aesthetic.

### 📊 Executive Analytics Dashboard
* **Dynamic Header Greetings**: Real-time sales metrics summaries (leads generated today, pending tasks).
* **KPI Metrics Cards**: Total Leads, New Leads, Conversion Rate, and Pipeline Revenue Potential (in Indian Rupees ₹) rendered with growth indicators and inline micro SVG trend sparklines.
* **SVG Analytics Charts**: Custom-drawn, fully responsive column growth bar charts, line conversion charts, and a segment-wise lead source donut distribution chart.
* **Sales Conversion Funnel**: A visual pipeline showing conversion stages (Total Leads ➔ Contact Initiated ➔ Sales Qualified ➔ Converted stage with success metrics).
* **Team Performance Leaderboard**: Ranking list showing rep conversion rates and closed deals value.

### 🗂️ Kanban Deal Pipeline Board
* Stage-wise division: `New Leads`, `Contacted`, `Qualified`, and `Converted`.
* Real-time revenue summaries and lead counting per pipeline stage.
* **HTML5 Drag-and-Drop**: Easily move client cards between stages to instantly update statuses in the backend database.
* **AI Score Badging**: Leads are classified as **Hot** (🟢 Score &ge; 80), **Warm** (🟡 Score &ge; 60), or **Cold** (🔴 Score &lt; 60) based on form values.

### 📅 Follow-Up Scheduler Calendar
* Auto-grouped calling lists: `Overdue Tasks` (past schedules), `Today's Schedule`, `Tomorrow`, and `Upcoming Future Tasks`.
* Action toggles: Complete calls ("Done") or adjust dates ("Reschedule") directly from individual task cards.

### 🔍 Search, Filtering & Data Exports
* Real-time global search input.
* Multi-dropdown filters (Status, Source, Representative, and Date range ranges).
* **Executive Data Exporters**: Single-click downloads for **CSV**, **Excel** sheets, and beautifully styled printable **PDF Executive Reports** with headers and footers.

### 🔐 Multi-Authentication Portal
* **Remember Me Persistence**: Toggles sessions between `localStorage` (keeps you logged in across browser restarts) and `sessionStorage` (clears credentials once the tab is closed).
* **Simulated Google Sign-In Chooser**: Bypasses unconfigured local GSI 401 blocks by providing a beautiful simulated Google accounts chooser. Remembers your logged-in Google profiles on the device for one-click access.
* **Forgot Password flow**: Generates a secure recovery verification code, logging it locally, and allowing verified password resets.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), CSS3 (Vanilla Custom Theme & Variables), Lucide Icons.
* **Backend**: Node.js, Express.js, JWT, Bcrypt.
* **Database**: MongoDB (Production Mongoose) / Local JSON File DB (Development Fallback).

