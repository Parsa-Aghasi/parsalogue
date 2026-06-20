import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../../.quartz/plugins"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'localStorage.setItem("theme","dark");document.documentElement.setAttribute("saved-theme","dark");',
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const renderInlineTitleMarkup = () => {
                  document
                    .querySelectorAll(
                      ".article-title, .breadcrumb-container a, .recent-notes a.internal, .explorer a, article a",
                    )
                    .forEach((element) => {
                      if (!(element instanceof HTMLElement)) return
                      if (!element.textContent?.includes("~~")) return

                      const parts = element.textContent.split(/(~~[^~]+~~)/g)
                      const fragment = document.createDocumentFragment()

                      parts.forEach((part) => {
                        if (part.startsWith("~~") && part.endsWith("~~")) {
                          const del = document.createElement("del")
                          del.textContent = part.slice(2, -2)
                          fragment.appendChild(del)
                        } else {
                          fragment.appendChild(document.createTextNode(part))
                        }
                      })

                      element.replaceChildren(fragment)
                    })
                }

                const quoteDirectionMarkers = [
                  { pattern: /^\\s*\\[!?(?:quote-)?ltr\\]\\s*/i, className: "quote-ltr" },
                  { pattern: /^\\s*\\[!?(?:quote-)?rtl\\]\\s*/i, className: "quote-rtl" },
                ]

                const applyBlockquoteDirections = () => {
                  document.querySelectorAll("blockquote").forEach((quote) => {
                    if (!(quote instanceof HTMLElement)) return

                    const firstParagraph = quote.querySelector("p")
                    if (!firstParagraph) return

                    const firstTextNode = Array.from(firstParagraph.childNodes).find(
                      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
                    )
                    const rawText = firstTextNode?.textContent ?? ""
                    const marker = quoteDirectionMarkers.find(({ pattern }) => pattern.test(rawText))
                    if (!marker || !firstTextNode) {
                      if (quote.dataset.quoteDirection === "manual") return
                      if (/^[\\s"'“‘(]*[A-Za-z]/.test(firstParagraph.textContent ?? "")) {
                        quote.classList.remove("quote-rtl")
                        quote.classList.add("quote-ltr")
                      }
                      return
                    }

                    quote.classList.remove("quote-ltr", "quote-rtl")
                    quote.classList.add(marker.className)
                    quote.dataset.quoteDirection = "manual"
                    firstTextNode.textContent = rawText.replace(marker.pattern, "")

                    if (!firstParagraph.textContent?.trim() && firstParagraph.childNodes.length === 1) {
                      firstParagraph.remove()
                    }
                  })
                }

                const closeGraph = () => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
                  document.querySelectorAll(".global-graph-outer.active").forEach((graph) => {
                    graph.classList.remove("active")
                    const sidebar = graph.closest(".sidebar")
                    if (sidebar instanceof HTMLElement) sidebar.style.zIndex = ""
                  })
                }

                const ensureGraphCloseButtons = () => {
                  document.querySelectorAll(".global-graph-outer").forEach((graph) => {
                    if (graph.querySelector(".global-graph-close")) return

                    const button = document.createElement("button")
                    button.type = "button"
                    button.className = "global-graph-close"
                    button.setAttribute("aria-label", "Close graph view")
                    button.setAttribute("title", "Close graph view")
                    button.innerHTML =
                      '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4.5 4.5 13.5 13.5M13.5 4.5 4.5 13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
                    button.addEventListener("click", closeGraph)
                    graph.appendChild(button)
                  })
                }

                const defaultDocumentLocale = {
                  lang: document.documentElement.lang || "fa",
                  dir: document.documentElement.dir || "rtl",
                }

                const setAttributeIfNeeded = (element, attribute, value) => {
                  if (element.getAttribute(attribute) !== value) {
                    element.setAttribute(attribute, value)
                  }
                }

                const jalaliMonths = {
                  Farvardin: "Farvardin",
                  Ordibehesht: "Ordibehesht",
                  Khordad: "Khordad",
                  Tir: "Tir",
                  Mordad: "Mordad",
                  Shahrivar: "Shahrivar",
                  Mehr: "Mehr",
                  Aban: "Aban",
                  Azar: "Azar",
                  Dey: "Dey",
                  Bahman: "Bahman",
                  Esfand: "Esfand",
                }

                const formatEnglishDate = (isoDate) => {
                  const date = new Date(isoDate)
                  if (Number.isNaN(date.getTime())) return null

                  const gregorian = date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })

                  try {
                    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).formatToParts(date)
                    const day = parts.find((part) => part.type === "day")?.value
                    const month = parts.find((part) => part.type === "month")?.value
                    const year = parts.find((part) => part.type === "year")?.value
                    if (day && month && year) {
                      return (
                        gregorian +
                        " - " +
                        day +
                        " " +
                        (jalaliMonths[month] ?? month) +
                        " " +
                        year
                      )
                    }
                  } catch {}

                  return gregorian
                }

                const localizeEnglishDates = () => {
                  document.querySelectorAll("time[datetime]").forEach((time) => {
                    if (!(time instanceof HTMLTimeElement)) return
                    const formatted = formatEnglishDate(time.dateTime)
                    if (formatted && time.textContent !== formatted) time.textContent = formatted
                  })
                }

                const localizeFooter = (isEnglishSection) => {
                  document.querySelectorAll("footer p").forEach((paragraph) => {
                    if (!(paragraph instanceof HTMLElement)) return
                    const firstNode = paragraph.firstChild
                    if (!firstNode || firstNode.nodeType !== Node.TEXT_NODE) return
                    const text = isEnglishSection ? "Made with " : "ساخته شده با "
                    if (firstNode.textContent !== text) firstNode.textContent = text
                  })
                }

                const localizeEnglishSection = () => {
                  const slug = document.body?.dataset.slug ?? ""
                  const isEnglishSection = slug.startsWith("parsalogue-english/")
                  document.body?.classList.toggle("english-section", Boolean(isEnglishSection))

                  if (!isEnglishSection) {
                    setAttributeIfNeeded(document.documentElement, "lang", defaultDocumentLocale.lang)
                    setAttributeIfNeeded(document.documentElement, "dir", defaultDocumentLocale.dir)
                    if (document.body?.hasAttribute("dir")) document.body.removeAttribute("dir")
                    localizeFooter(false)
                    return
                  }

                  setAttributeIfNeeded(document.documentElement, "lang", "en")
                  setAttributeIfNeeded(document.documentElement, "dir", "ltr")
                  if (document.body) setAttributeIfNeeded(document.body, "dir", "ltr")
                  localizeEnglishDates()
                  localizeFooter(true)

                  const setText = (selector, text) => {
                    document.querySelectorAll(selector).forEach((element) => {
                      if (element instanceof HTMLElement && element.textContent !== text) {
                        element.textContent = text
                      }
                    })
                  }

                  setText(".graph h3", "Graph View")
                  setText(".toc h3", "Contents")
                  setText(".backlinks h3", "Backlinks")
                  setText(".explorer .title-button h2", "Pages")
                  setText(".recent-notes h3", "Recent Notes")

                  document.querySelectorAll(".search-button").forEach((button) => {
                    if (!(button instanceof HTMLElement)) return
                    setAttributeIfNeeded(button, "aria-label", "Search")
                    button.querySelectorAll("p").forEach((label) => {
                      if (label.textContent !== "Search") label.textContent = "Search"
                    })
                  })

                  document.querySelectorAll("input[type='search'], .search-bar").forEach((input) => {
                    if (!(input instanceof HTMLInputElement)) return
                    if (input.placeholder !== "Search") input.placeholder = "Search"
                    setAttributeIfNeeded(input, "aria-label", "Search")
                  })
                }

                const enhancePage = () => {
                  ensureGraphCloseButtons()
                  localizeEnglishSection()
                  renderInlineTitleMarkup()
                  applyBlockquoteDirections()
                }

                document.addEventListener("DOMContentLoaded", enhancePage)
                document.addEventListener("nav", enhancePage)
                document.addEventListener("render", enhancePage)
                new MutationObserver(enhancePage).observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                })
              })()
            `,
          }}
        />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
