# Scraper

This is a quick web scraper that will crawl herbalife product listing page and then iterate over all pdp pages looking for a feature content carousel, scope, number of items in the carousel. The end result is a csv with the url of page (string), featureContentCarousel (boolean), scope (string), and count (number).

How to run:
`node index locale in|out`

e.g. `node index en-sg in` will run this against English Singapore locale with the user accepting cookies

`locale` is the lang-location combination e.g. en-sg

`in` will signify that the user has consented to cookies

`out` will signify that user has not consent to cookies
