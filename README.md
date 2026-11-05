# Super Emilia World

A little platform adventure with five lands, three companion buddies, and 60 stages. Run, double jump, bounce on grumps, discover hidden pipe entrances, collect coins in mini-games, and rescue friends.

Play at **https://superemilia.com**. The game is hosted on GitHub Pages.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | Arrow keys or A / D |
| Jump / double jump | Space, Up, or W |
| Run | Hold Shift |
| World power | E |
| Explore a pipe | Down or S while standing on its opening |
| Pause / resume | P |

On-screen controls support touch. Tap **Run** to toggle sprinting, use the large direction and jump buttons, and press **↓** on a pipe opening. Toast messages appear below the top HUD.

**How to play** opens a scrollable popup from the footer or Settings. It pauses a running game and resumes it on close. Escape, the close button, or **Got it!** dismiss it; opening it from an already paused or ready screen preserves that state.

Use **Map** to choose one of five lands and a level spot. Completed stages and found treasures appear on the map. All stages are available to explore.

Use **Characters** to build Emilia's look from outfits, hairstyles, skin tones, eye styles, colors, accessories, and unlockable hats. Pip, Mochi, and Luna have their own color and accessory choices. The live preview shows each selection before **Use this look** saves it. No drawing is required.

Secret entrances blend in with the scenery; there are no secret-trail signs. Three entrances in each stage lead to a rotating selection of four coin games: a coin vault, a falling-coin challenge, a bouncing challenge, and a five-tier mystery-block ladder. Reaching the target earns a hidden gem, extra coins, and wardrobe stars. Every collected coin is kept even if time runs out. Returning restores the level, checkpoint, health, enemies, and active powers.

In the mystery ladder, jump under one of three blocks on each tier. One holds coins; an empty guess closes the other blocks on that tier. Each guess unlocks the next floor. Double jump up to keep trying, then leave through the top pipe after all five tiers. Higher tiers pay more coins. This room has no timer; two winning tiers in Gentle mode or three in Adventure mode earn its hidden gem.

Settings contain sound and difficulty controls. Coins, stars, rescued friends, completed stages, and character choices save in the current browser.

The page includes Open Graph and large Twitter card metadata with original wide and square cover art in `public/assets`. Preview images use absolute HTTPS URLs, descriptive alternative text, and their actual pixel dimensions. The wide cover is the default sharing image. Titles and descriptions cover the 60 levels, five lands, buddies, secret coin games, character choices, and free browser play. Static JSON-LD connects the website, page, game, author credit, and cover image so readers can discover the game's details without executing JavaScript. Existing social posts may retain the preview cached by their platform.

## Make changes

The complete game is in `public/index.html`; it has no dependencies or build step. Open that file in a browser to play locally, or run `python3 -m http.server --directory public`.

Push changes to `main` to publish automatically. The **Deploy game to GitHub Pages** workflow checks the script, runs `node tests/game.cjs`, uploads only the `public` folder, and deploys to the `github-pages` environment.

## Hosting and domain

Repository: https://github.com/dalton-cole/superemilia

GitHub Pages settings: https://github.com/dalton-cole/superemilia/settings/pages

The publishing source is **GitHub Actions**, with **superemilia.com** as the custom domain and HTTPS enforced once GitHub issues its certificate.

Namecheap BasicDNS should contain these website records:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | dalton-cole.github.io |

Replace the default Namecheap parking/redirect records for `@` and `www`. Preserve unrelated mail, verification, and other DNS records. GitHub redirects `www.superemilia.com` to the apex domain after both resolve correctly. DNS changes and certificate issuance may take time to propagate.

Custom domains for GitHub Actions deployments are configured in Pages settings; a repository `CNAME` file is not needed. See [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
