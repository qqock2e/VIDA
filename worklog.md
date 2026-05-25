# VIDA POKER v3 Worklog

---
Task ID: 1
Agent: main
Task: Apply user feedback to VIDA POKER game (game.js, main.js, index.html)

Work Log:
- Rewrote game.js with additive multiplier system (starts at 0x for highCard)
- New HAND_MULTS: pair=0.5, twoPair=0.8, threeOfAKind=1.1, straight=1.5, flush=1.3, fullHouse=1.7, fourOfAKind=3.0, straightFlush=5.0, royalFlush=8.0
- New SUIT_PER_CARD additive bonus: spade=0.08, diamond=0.06, heart=0.05, club=0.03
- New getRankBonus() function: additive based on average card rank value
- computeReturn() now uses sum of all bonuses (hand + suit + rank + passives) instead of multiplication
- Points reworked: fixed per hand type (HAND_POINTS) instead of scaling with earned life
- advanceRound gives 5 + round points (enough for 1-2 upgrades per round)
- Added preBet phase: player bets BEFORE seeing cards
- confirmBetAndDeal() locks bet and deals cards
- adjustBet() only works during preBet phase
- i18n-aware breakdown labels for multiplier display

- Rewrote main.js:
  - Removed result modal entirely
  - Added showMultiplierBreakdown(): floating "×N (label)" lines appear one by one
  - Added large total "×N" display in upper-middle screen
  - Added screen shake (light for mult≥1.5, heavy for epic/legendary or mult≥3.0)
  - PreBet UI: shows bet adjustment before cards are dealt
  - After settle animation + multiplier display, auto-transitions to shop
  - No result modal in HTML anymore

- Rewrote index.html:
  - Added screenShake and screenShakeHeavy CSS animations
  - Added #multBreakdownWrap and #multTotalDisplay for floating multiplier display
  - Added #preBetSection with bet controls and "Deal Cards" button
  - Removed result modal from HTML
  - Added .btn-deal-large style
  - Added position:relative to #gameScreen for absolute positioning of multiplier displays

- Deployed to public/vida-poker/ and embedded via iframe in page.tsx
- Added eslint ignores for public/vida-poker/ and upload/ directories

Stage Summary:
- Additive multiplier system: totalMult = handMult + suitBonus + rankBonus + passiveBonuses
- Straight ≈ 2.0x total (1.5 hand + ~0.5 bonuses)
- Points system allows 1-2 upgrades per round
- Betting happens before seeing cards (preBet phase)
- No result modal; multiplier breakdown shown as floating animation
- Screen shake on settle/fold
- All changes deployed and linting passes

---
Task ID: 3
Agent: leaderboard-api-agent
Task: Create leaderboard database model and API routes

Work Log:
- Updated prisma/schema.prisma: removed default User and Post models, added LeaderboardEntry model (id, nickname, points, round, difficulty, createdAt)
- Ran `bun run db:push` — schema synced successfully, Prisma Client regenerated
- Created /src/app/api/leaderboard/route.ts with:
  - POST handler: validates nickname, points, round, difficulty; creates LeaderboardEntry; returns 201 with created entry
  - GET handler: returns top 10 entries sorted by points desc then round desc
- Tested both endpoints with curl — POST returns created entry, GET returns sorted array
- Lint passes cleanly

Stage Summary:
- LeaderboardEntry model available in DB
- POST /api/leaderboard and GET /api/leaderboard endpoints working

---
Task ID: 4
Agent: main
Task: Fix bet return calculation, mobile responsiveness, leaderboard UI, deployment guide

Work Log:
- Fixed bet return calculation in game.js placeBet():
  - Old: G.life += (betHeld + profit - roundCost) → returned bet + profit (double counting)
  - New: G.life += (winnings - roundCost) → only returns bet*mult as winnings
  - Formula: -bet (deducted at preBet) + bet*mult (winnings) - roundCost = net
  - At 1.5x with bet 10: -10 + 15 = +5 profit (correct)
- Updated main.js showMultiplierBreakdown(): replaced "Bet returned" line with "Winnings" line
- Updated main.js renderHandResult(): shows "−bet (베팅) + winnings (획득) − drain (차감)"
- Enhanced mobile responsiveness in index.html CSS:
  - Smaller cards (54x78px), smaller fonts, tighter padding
  - Cards row centered, bet buttons smaller
  - Game over panel and leaderboard screen responsive
  - Multiplier display smaller on mobile
- Added leaderboard screen to index.html with lb-row CSS styling
- Added game-over nickname input section with submit button
- Added 🏆 LEADERBOARD button on title screen
- Added submitScore() function in main.js: POST to /api/leaderboard
- Added showLeaderboardScreen() function: GET from /api/leaderboard, render top 10
- Added scoreSubmitted flag to prevent double submission
- Added I18N strings for game-over and leaderboard (en/ko)
- All lint passes, dev server running correctly

Stage Summary:
- Bet return formula fixed: -bet + bet*mult - roundCost
- Mobile responsive UI with proper breakpoints
- Leaderboard screen with top 10 display (gold/silver/bronze icons)
- Game over with nickname input → score submission to API
- Title screen has leaderboard button

---
Task ID: 5
Agent: main
Task: Fix centering, game-over→title bug, round-based leaderboard with difficulty tabs, DB migration prep

Work Log:
- Moved #handBadge from inside #handSection to direct child of #gameScreen for proper centering
- Added #leaderboardScreen centering via align-items:center;justify-content:center
- Fixed showTitle() to reset G=null, preventing stale game state showing betting screen
- Updated leaderboard API (route.ts): sort by round DESC, points DESC; added ?difficulty= filter param
- Changed GET /api/leaderboard: without filter returns 30 entries, with filter returns top 10
- Added difficulty tab UI (ALL/EASY/NORMAL/HARD/INSANE) with switchLbTab() function
- In "ALL" tab, entries grouped by difficulty sections (insane→hard→normal→easy)
- Each row shows round number prominently (Rd.N) as primary ranking metric
- Added .lb-tabs, .lb-tab, .lb-section-title, .lb-round CSS classes
- Added mobile responsive styles for leaderboard tabs and rows
- DB migration: installed @prisma/adapter-pg and pg packages for PostgreSQL support
- Kept SQLite for local dev; provided deployment guide with PostgreSQL setup instructions

Stage Summary:
- Hand badge and leaderboard properly centered on screen
- Game over → title screen no longer shows betting screen (G=null reset)
- Leaderboard is round-based with difficulty tab sections
- API supports ?difficulty= filter and round DESC sorting
- PostgreSQL packages installed, ready for production migration
