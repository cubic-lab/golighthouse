# Golighthouse Client

This client is built on top of vue, tailwindcss & nextui. The aim of the client is to provide a web ui to display the status of background lighthouse process and provide an easy way for use to view their site lighthouse reports of pages.

## Requirements

- Provide one page to complete all the operations.
- As an user, I can see my site report table when i open the app.
- As an user, i filter the report table content via page path.
- As an user, i can see the progress of background job status: percentage of completed jobs, current completed jobs / total jobs, time remaining, cpu usage.
- As an user, I can switch between categories report table: performance, accessibility, best practices, seo.
- As an user, i can switch between different sites.
- As an user, i can open lighthouse report html once i click the row of report table

## UI Design

- TOP: Logo, current website, filter of search paths, rescan site button, job progress, time remaining, cpu usage.
- SIDEBAR: A menu includes: Performance, Accessibility, Best Practices, SEO
- MAIN CONTENT: report tables
  - performance table columns: page, score, fcp, lcp, cls, tbt, actions
  - accessibility table columns: page, score, color contrast, headings, aria, actions
  - best practices table columns: page, score, errors, inspector issues, images responsive, actions
  - seo table columns: page, score, indexable, internal links, external link, description, actions.