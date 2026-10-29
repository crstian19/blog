# listmonk theme for blog.crstian.me

Files for listmonk v6.2.0 (https://newsletter.crstian.me). Nothing here touches a live system.

| File | What | Where to paste |
|---|---|---|
| `campaign-template.html` | Campaign email template (table layout, 600px, light baseline, dark via `prefers-color-scheme`) | Admin > Campaigns > Templates > New, type "Campaign", paste, save, set as default |
| `public.css` | Styles for the public pages (unsubscribe, manage, archive, message, subscription form) | Admin > Settings > Appearance > Public > Custom CSS |
| `preview/` | Static renders with sample content from the Wails vs Tauri post, plus light/dark PNGs | Open the `.html` files in a browser |

Colors and radius (4px) come from `src/styles/global.css` of the blog (purple hue 285, OLED black in dark mode). Fonts: Geist for text and Lexend for headings, with system fallbacks. They are not loaded in email, so most clients show the fallbacks.

## Limits

- Email dark mode: Apple Mail and some Outlook builds honor `prefers-color-scheme`. Gmail apps re-color on their own and ignore it, so the light version is the baseline.
- Public pages: the logo `<img>` is hidden and the blog name is drawn with `::before` text, so no logo upload is needed. A page title or footer text cannot be changed with CSS.
- The "Powered by listmonk" footer and all texts stay as is. Changing them needs an i18n override (Admin > Settings > Appearance > language file) or template overrides with `--static-dir`: `public/templates/index.html` (header/footer markup, fonts `<link>`, dark-mode `color-scheme` meta) and `public/templates/subscription.html` (copy of the unsubscribe flow). Not required for this theme.
- Web fonts cannot be loaded from CSS-only injection without an `@import` to an external host; `public.css` does not do it, so public pages also use fallbacks unless you add `@font-face` pointing at blog.crstian.me font files.
- The campaign template must be re-checked in a real client (send a test) since the previews are only browser renders.
- Preview uses `listmonk-style.css`, a copy of listmonk's stock `style.css` that `public.css` overrides.

## welcome-template.html

Transactional template sent right after someone subscribes from the blog (single opt-in,
so listmonk sends nothing by itself). Create it under Campaigns > Templates with type
**Transactional** and this subject:

```
{{ if eq (default "es" .Tx.Data.lang) "en" }}You're in{{ else }}Ya estás dentro{{ end }}
```

The signup service sends it with `POST /api/tx` (`template_id`, `subscriber_email`, and
`data: {lang, latest_title, latest_url}`). Transactional templates have no
`UnsubscribeURL`, so the footer builds the unsubscribe link the way listmonk does for its
own opt-in email: a dummy campaign UUID plus the subscriber UUID.
