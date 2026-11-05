# Super Emilia

A little platform adventure with five worlds, three companion buddies, and 60 stages. Run, double jump, bounce on grumps, collect stars, discover hidden gems, and rescue friends.

Play at **https://superemilia.com**. The game is hosted on GitHub Pages.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | Arrow keys or A / D |
| Jump / double jump | Space, Up, or W |
| Run | Hold Shift |
| World power | E |
| Pause / resume | P |

On-screen controls support touch. Settings contain the world and stage selectors, buddies, hats, sound, and difficulty. Rewards save in the current browser.

## Make changes

The complete game is in `public/index.html`; it has no dependencies or build step. Open that file in a browser to play locally, or run `python3 -m http.server --directory public`.

Push changes to `main` to publish automatically. The **Deploy game to GitHub Pages** workflow checks the script, uploads only the `public` folder, and deploys to the `github-pages` environment.

## Hosting and domain

Repository: https://github.com/dalton-cole/superemliia

GitHub Pages settings: https://github.com/dalton-cole/superemliia/settings/pages

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
