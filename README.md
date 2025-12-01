📦 USDT Trading Bot – Telegram Client

A Telegram-based peer-to-peer USDT marketplace bot

This repository contains the Telegram Bot Application, responsible for user interaction, step-by-step trading flows, role-based menu navigation, and communication with the Core Backend Service.
All persistent business logic (Orders, Offers, Deals, KYC, Roles) is handled by the Core app — the bot focuses exclusively on UX and conversation flow.

⸻

🚀 Business Purpose

The bot enables users to safely trade USDT in a peer-to-peer manner inside Telegram.

Users can:
	•	Create Buy/Sell orders
	•	View market orders
	•	Submit offers on other users’ orders
	•	Manage their own orders & offers
	•	Complete verified KYC
	•	Edit profile information

Admins can:
	•	Review & approve KYC requests
	•	Manage open deals
	•	Access deal archives
	•	View users list & statuses

Orders are automatically shared in a public Telegram channel, allowing all users to discover new opportunities.

The system is intentionally simple for MVP phase, with manual admin supervision and no automatic payments.

⸻

📁 Folder Structure

src/
  index.ts                 // Bot entry point

  bot/
    bot.ts                 // GrammY initialization + middlewares
    middlewares/           // Logging, error handling, role detection
    handlers/              // Command and callback controllers
      start.ts
      profile/
      kyc/
      orders/
      offers/
      admin/
    conversations/         // Wizard flows for multi-step inputs

  core/
    coreClient.ts          // axios wrapper for Core API

  ui/
    messages/              // All bot text messages
      common.ts
      menu.ts
      orders.ts
      offers.ts
      profile.ts
      kyc.ts
      admin.ts
    keyboards/             // Inline keyboards (menus + actions)
      mainMenu.ts
      orders.ts
      offers.ts
      profile.ts
      admin.ts

  config/
    env.ts                 // Environment variable loading + validation

  types/
    session.ts             // GrammY session (wizard) type definitions

Why this structure?
	•	handlers/ holds core interaction logic
	•	conversations/ stores step-by-step workflows
	•	messages/ & keyboards/ centralize UI for easy editing
	•	coreClient.ts isolates Core API communication
	•	env.ts ensures safe environment variable validation
	•	session.ts prevents wizard state bugs thanks to strict typing

⸻

🧰 Technologies Used

Component	Technology
Bot Framework	grammY
Language	TypeScript
Core Communication	Axios
Environment Config	dotenv
Session Storage	grammY in-memory session (upgradeable to Redis)
Runtime	Node.js

No database is used inside the bot — only the Core App stores persistent data.

⸻

🧩 UX Flow Overview (Based on Attached Diagram)

🟦 Main Entry: /start

From the main menu, users can:

My Orders
My Offers
New Order
Profile
  ├── Edit Profile
  └── Request KYC
Admin Menu (visible only to admin/super-admin)
  ├── KYC List
  ├── Open Deal
  ├── Deal Archive
  └── Users List


⸻

📱 User Flows

🟩 Profile Menu

Profile
 ├── Edit Profile
 │    - Change full name
 │    - Update optional details
 └── Request KYC
      - Enter full name
      - Approve Telegram phone number
      - Submit KYC request

Users must pass KYC before:
	•	Creating orders
	•	Submitting offers

⸻

🟧 Creating New Order

Wizard steps:
	1.	Choose side (Buy / Sell)
	2.	Enter amount (USDT)
	3.	Enter price per unit
	4.	Enter network (TRC20 / ERC20 / TON …)
	5.	Optional description
	6.	Summary review
	7.	Confirm → Bot sends order to Core
	8.	Bot posts order into public channel

⸻

🟪 Creating a New Offer
	1.	Select order
	2.	Enter offered price per unit
	3.	Optional comment
	4.	Maker receives Accept/Decline choice
	5.	If accepted → Core creates a Deal
	6.	Admin handles Deal in Admin Menu

⸻

🟥 Admin Menu (Role-based)

Admin Menu
 ├── KYC List        → Approve/Reject KYC requests
 ├── Open Deal       → Manage active deals
 ├── Deal Archive    → View old completed/cancelled deals
 └── Users List      → View roles, KYC status, profile info


⸻

📢 Public Order Channel

Every order created by a user is automatically posted to a public Telegram channel.

The channel ID must be configured inside .env:

PUBLIC_ORDER_CHANNEL_ID=-1001234567890

If posting fails, the bot logs the error but still confirms order creation.

⸻

🔌 Accessing the Core App

The bot communicates with the Core Backend using HTTP requests with headers:

x-api-key
x-telegram-user-id

Required Environment Variables

CORE_API_KEY=your_key
CORE_BASE_URL=https://your-core-app.com
PUBLIC_ORDER_CHANNEL_ID=-1001234567890

Core Documentation

(Replace with real documentation URL):
👉 Core API Docs: https://example.com/core-docs

The bot does NOT handle business logic — it delegates everything to Core.

⸻

⚠️ Important Development Notes

1. The bot is stateless

Only temporary wizard data is stored via GrammY session.

2. All UI text is centralized

Located in src/ui/messages/ —
This makes maintenance, translations, and future design changes very easy.

3. Session only manages bot flow

Not suitable for long-term business logic — that lives in Core.

4. Role detection for Admin Menu

Bot must always check user’s role from Core before showing admin menu.

5. Public channel posting is critical

Any change to message format should remain consistent for users.

⸻

🖼️ UX Diagram

(Replace with your actual file path)

⸻
