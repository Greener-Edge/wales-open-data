# Cache-busting versions

Each site's page links its styles, scripts and data with `?v=YYYYMMDD`. GitHub Pages tells browsers to cache files for about 10 minutes, so after a change, bump the version in that site's `index.html` (all occurrences) so visitors get fresh files together rather than a mix of old and new.
