# Products in articles — how the best stores and the guidance do it (research 2026-10-23)

Purpose: the owner's questions on the blog's «Matching products» (23.10.2026): how many products
an article should show, how they are chosen (the article's category, mixed categories, products
named in the text), where they go (inline, end, sidebar), and how it should work on a phone.
"Measured" = read from the live DOM with Playwright (headless Chromium, logged out, cookie banners
declined) at **390×844** and **1280×900**; positions are % of the article length (0 = title,
100 = last paragraph, >100 = after the text). Scripts and raw JSON:
`scratchpad/article-products/measure.mjs`, `raw/<store>-<n>-<mobile|desktop>.json` (session
fdae7e0a). Not verified: real touch swiping; editor vs rule-based picking (inferred from names);
personalisation (logged-out US/UK defaults only).

## What our storefront does today (templates/storefront, 23.10.2026)

- One shelf per article (`Post.shelf`), its 8 most popular products as a rail «Matching products»
  after the text and the FAQ (`app/[site]/[lang]/blog/[slug]/page.tsx`, `PRODUCTS_SHOWN = 8`).
- On desktop also one product card beside the text that changes by section (`ReadAlong`, 2–3
  cards; owner's word 22.10.2026). On a phone there is no side column — products appear only at
  the end.
- Products named in the text are not linked as products; categories are never mixed.

## Measured: 13 stores, 2 articles each

| Store | Modules → products | Phone / desktop | Card | Relation to the text |
| --- | --- | --- | --- | --- |
| Gymshark (heavyweight t-shirts; hyrox guide) | A1: 4 inline «Shop now» at 35/49/70/87 %, 3·3·2·3 = 11; A2: 1 at 10 %, 5 | swipe, card 75 % of screen, 1 + peek / row of 2–3, mosaic 2+3 | image, rating, name, fit/colour, price; no cart button | category of the section |
| The Ordinary (retinoids; dark spots) | A1: comparison at 34 % (2) + end carousel at 102 % (4); A2: 0 | row of 2 at 42 % each; swipe card 49 %, ~1.6 visible / rows of 2 and 4 | image, name, rating + count, size, price, Add to Cart | the compared pair is the one discussed; end = topic category |
| Myprotein (hyrox; protein & GLP-1) | A1: 7 modules = 18 (rails 4·4·2 at 55–67 %, 3 singles at 77–91 %, end rail of 5 at 109 %); A2: 1 single at 76 % | card 395 px = 101 % of screen (outlier) / 3 visible | image, name, was/now/save, Quick buy | per-section category; end rail = bestsellers |
| Lush (skincare myths; fresh cosmetics) | A1: 1 end «You might also like» at 102 %, 5; A2: 0 | swipe, card 45 %, ~2 visible / 3 + peek | badge, image, name, type, one line, rating, price, Add | all 5 named in the text |
| CBDfx (gummies for stress; capsules) | A1: comparison table at 9 % (5 named links) + 2 «Featured in this article» cards at 36/54 %; A2: 2 cards at 17/49 % + list of 2 at 72 % | horizontal card (thumbnail + text) 92 % wide, ~140 px / 43 % of column | thumbnail, name, strength, was/now, rating, Buy it now | named in the text |
| Nordic Oil (CBN dosage; roll-on) | A1: 0 (sale banner only); A2: 1 single at 38 % | 92 % wide but 813 px tall / horizontal card 57 % | image, name, ✓ benefits, price, Add to basket | the article's product |
| Paula's Choice (niacinamide; CBD for skin) | A1: «Recommended products» at 5 % (3) + 5 text links; A2: 0 | 2 + 1 grid of 100 px thumbnails / row of 3 | image, name | named ingredient |
| Ritual | 0 cards; 4 and 1 text links; category tiles before the footer | — | — | named |
| Allbirds | 0 cards; «Shop men's / women's» link pair after each shoe section; 3 text links | — | — | named |
| Into The Gloss / Glossier | A1: 10 inline shade links (affiliate); A2: 0 | — | — | named |
| Cibdol | 0 cards; 1–2 text links | — | — | named |
| Blessed CBD | 0 cards; 1 text link (at 10 % and 32–42 %) | — | — | named |
| AG1 | no products, no product links | — | — | — |

Blocked or not found: Charlotte's Web, Extract Labs, Cornbread Hemp (Cloudflare), Patagonia
(queue), REI, Holland & Barrett (403), Joy Organics (access denied); Lord Jones, Huel (no article
reached); Sephora and Healthline not tried.

**Synthesis of the measurement**
- Cards appear in 10 of 26 articles (6 of 13 stores): median per article 0; where cards exist,
  median 4 products (1–18). Median per block 2, the largest block 5. No store shows 8, none puts a
  fixed rail under every article.
- 17 of 22 card blocks (77 %) are inline after the section that talks about the product; 3 at the
  end, 2 at the top. The most common product presence overall is a link inside a sentence
  (8 of 13 stores).
- No desktop sidebar or sticky product card in any store (sticky only: table of contents, recent
  posts, header). No sticky product or buy bar on any phone page.
- Phone: 1 product → full-width card (89–92 % of the screen); 2 → a row of two; 3–5 → horizontal
  swipe, card 45–75 % of the screen with the next one peeking.
- Selection: the product named in the text, or the category of the section it sits under. No
  store mixes categories in one block; bestsellers only as an end rail (Myprotein).

## Written guidance

| Question | Guidance | Source |
| --- | --- | --- |
| how many | complementary block — 2–3 products by default, more behind paging | https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations/complementary-products |
| how many | only as many as are truly relevant; one weak pick makes users distrust the set | https://baymard.com/blog/product-recommendations-cart |
| how many, phone | last item within 3–4 swipes; 5 frames or fewer | https://www.nngroup.com/articles/mobile-carousels/ · https://www.nngroup.com/articles/designing-effective-carousels/ |
| at least | every post links at least one relevant product or collection | https://www.shopify.com/blog/ecommerce-blog-post-templates |
| selection | a product named in editorial content must be reachable where it is named | https://baymard.com/blog/inspirational-product-images-links |
| selection | similar (alternatives) and complementary (add-ons) are separate, labelled groups; 42 % of sites offer both | https://baymard.com/blog/product-page-suggestions |
| selection | Shopify intents: COMPLEMENTARY «Pair it with» and RELATED «You may also like» | https://shopify.dev/docs/api/storefront/latest/enums/ProductRecommendationIntent |
| selection | say why an item is shown; narrow groups instead of one broad list | https://www.nngroup.com/articles/recommendation-guidelines/ |
| placement | end-only misses readers: average scroll depth 54 % (Contentsquare 2022); 74 % of viewing time in the first two screens (NN/g) | https://www.businesswire.com/news/home/20220324005433/en · https://www.nngroup.com/articles/scrolling-and-attention/ |
| placement | the right rail is skipped even when useful (banner blindness) | https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ |
| links | product links in sentences: crawlable `<a href>` with descriptive text | https://developers.google.com/search/docs/crawling-indexing/links-crawlable |
| phone | swipe with a peek of the next card, don't rely on dots, edge gutter; never autoplay, best item first | https://www.nngroup.com/articles/mobile-carousels/ · https://baymard.com/blog/homepage-carousel |
| card | thumbnail, full name, price, rating — on the phone too | https://baymard.com/blog/product-page-suggestions-information |
| pitfalls | ad-like inserts (coloured boxes, motion) are skipped; a page is rated Low when inserts interrupt the main content | https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ · https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf |
| pitfalls | content made mainly for search visits is not helpful; a how-to names products without becoming a pitch | https://developers.google.com/search/docs/fundamentals/creating-helpful-content · https://www.shopify.com/blog/ecommerce-blog-post-templates |
| CBD (EU) | any claim linking a product to health is a health claim (Reg. 1924/2006); none is authorised for CBD; «treats a disease» makes it a medicine (2001/83) | https://eur-lex.europa.eu/eli/reg/2006/1924/oj/eng · https://fsai.ie/business-advice/running-a-food-business/food-safety-and-hygiene/food-innovation/cbd-and-other-hemp-products |

No public controlled test comparing inline, end and sidebar placement was found (Nosto, Dynamic
Yield, Algolia, Klevu, Bloomreach publish none).

## What this means for the storefront

1. **Selection — what the text names first.** A product named in a section is linked in the
   sentence and shown as a card right after that section; the article's data carries the products
   per section (editor's pick), not a rule. Without named products — the category of the section,
   never a mix of categories in one block.
2. **How many — 1 to 3 per block, never filled.** Show only what is relevant; a block of 2–3 is the
   norm, 5 the ceiling. One end block as a recap of the article's products (up to 4), not a rail of
   8 bestsellers.
3. **Where — inline first, the end as a recap.** The first card within the first two screens
   (after the short answer or the first section that names a product); the end block repeats the
   article's products for those who read to the end.
4. **Phone — by the number of products:** one → a full-width horizontal card (thumbnail, brand,
   name, pack line, price, add); two → two stacked rows or a row of two; three to five → swipe rail
   with the next card peeking. No sticky product on the phone.
5. **The desktop side card (`ReadAlong`) is the owner's decision of 22.10.2026;** no measured store
   has one, and NN/g reports the right rail is skipped — shown to the owner as a fact, not changed.
6. **CBD:** no product block next to text about a disease or a cure; effect names are allowed
   (И804), disease names and result promises are not.
