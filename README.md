N# Abass Opela — Fashion Showcase & Customer Gallery

A multi-page showcase site for the **Abass Opela** fashion house. This is **not**
an e-commerce site: purchases happen physically, so there is no cart, checkout
or payment flow. Instead, the site presents the house's collections and a
moderated **customer gallery** where clients share how they wear the brand.

Built on **Next.js 16** (App Router, Server Actions), **React 19**,
**TypeScript**, **Tailwind CSS v4**, **SQLite** (`node:sqlite`) and **sharp**
for image processing.

## Pages

| Route | Description |
| --- | --- |
| `/` | Home — hero, featured collections, gallery preview, contact CTA |
| `/collections` | All published collections (lookbooks) |
| `/collections/[slug]` | A single lookbook |
| `/gallery` | Approved customer posts (photos + videos) |
| `/gallery/[id]` | A post with comments |
| `/about`, `/contact` | Editorial pages; contact notes land in the admin inbox |
| `/signin` | Admin and shared-customer sign in; admin account recovery |
| `/account` | Customer upload form |
| `/admin` | Studio: moderate posts & comments, media library |
| `/admin/collections` | Manage collections and their looks |
| `/admin/customers` | Set or replace the one shared customer username and password |
| `/admin/messages` | Contact inbox |
| `/admin/settings` | Brand name, logo replacement, copy, socials |

## Roles

- **Visitors** browse everything public.
- **Customers** all sign in with the same username and password provided by
  the admin. They can upload photos/videos (up to 10 MB / 100 MB, MP4 · WebM ·
  MOV · JPEG · PNG · WebP · GIF · HEIC) and comment. Uploads stay `pending`
  until an admin approves them. Because customers share an identity, posts and
  comments are attributed to the shared Customer profile; customers cannot
  delete content.
- **Admins** approve/reject/delete any post or comment, manage customer
  login credentials, curate collections, replace the logo and edit site copy.
  Only the admin can change the shared customer credentials; doing so signs
  out all customers.

Admins moderate all access and content manually — the site never pretends to
verify purchases.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

On first boot the app seeds its SQLite database (`data/abassopela.db`) from the
`images/` folder: all supplied photography becomes library media, distributed
across three starter collections, with `images/logo.jpeg` as the brand logo.
Everything seeded is fully editable or removable from the admin area.

### First admin sign-in

The first admin account is created automatically with username
`OPELA_USERNAME` and password `OPELA_PASSWORD`. Sign in, then open **Admin →
Settings → Admin login** to change these credentials. The current password is
required, and changing credentials signs out other admin sessions while
keeping the current session active.

These are public bootstrap credentials, so change them before exposing the
site to the internet. Passwords are stored as scrypt hashes.

Open **Admin → Settings → Admin account recovery** to permanently set the
admin's mother's full name as the recovery answer. This answer is stored as a
password hash and cannot be changed later. The recovery form allows five
incorrect attempts before it pauses for 15 minutes.

For a controlled initial setup, define these environment variables before the
first boot:

```text
ABASS_ADMIN_USERNAME
ABASS_ADMIN_PASSWORD
ABASS_ADMIN_RECOVERY_ANSWER
```

Do not commit these values to source control. Set `NEXT_PUBLIC_SITE_URL` in
production so sitemap/OG URLs are correct.

The initial shared customer login is username `USER001` and password
`PASSWORD12345`. It is active on first boot and is shown in **Admin →
Customers** until replaced. Share it with customers, or change it there to a
different username and password (at least 12 characters). Replacing the
credentials signs out every customer and invalidates the old password.

The admin can recover a forgotten username or password from the sign-in page
using the permanent recovery answer, then setting new credentials. If no
recovery answer has been set, recovery must be configured by the signed-in
admin or by the site operator.

## Data & media

- Database: `data/abassopela.db` (WAL mode; created on boot)
- Uploaded media: `data/media/<id>.<ext>`, served by `/api/media/[id]` with
  range support for video seeking
- Seeded brand photography stays in `images/` and is referenced directly.
  It is resized/optimized on demand; first boot does not generate thumbnails
  for every supplied image.

`data/` is git-ignored; back it up like any production database.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |

## SEO & accessibility

Per-page metadata and canonical URLs, dynamic `sitemap.xml` and `robots.txt`,
JSON-LD (Organization, CollectionPage, SocialMediaPosting), semantic landmarks,
skip-link, alt text on all imagery, visible focus states, reduced-motion
support, and loading/empty/error states throughout.
