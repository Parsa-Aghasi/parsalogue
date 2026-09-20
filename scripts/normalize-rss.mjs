import fs from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"

const feedPath = path.resolve("public/rss.xml")
const contentIndexPath = path.resolve("public/static/contentIndex.json")
const contentDirectory = path.resolve("content")
const feedUrl = "https://parsalogue.com/rss.xml"
const atomNamespace = 'xmlns:atom="http://www.w3.org/2005/Atom"'
const selfLink = `      <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

const normalizeSlug = (value) =>
  decodeURI(new URL(value, feedUrl).pathname).replace(/^\/+|\/+$/g, "")

const isRssArticle = (source) => {
  const frontmatter = source.match(frontmatterPattern)
  if (!frontmatter) return false

  return parse(frontmatter[1])?.rss === true
}

let feed = await fs.readFile(feedPath, "utf8")
const contentIndex = JSON.parse(await fs.readFile(contentIndexPath, "utf8"))
const includedSlugs = new Set()

for (const [slug, details] of Object.entries(contentIndex)) {
  if (typeof details?.filePath !== "string") continue

  const sourcePath = path.resolve(contentDirectory, details.filePath)
  if (!sourcePath.startsWith(`${contentDirectory}${path.sep}`)) {
    throw new Error(`Content index path escapes the content directory: ${details.filePath}`)
  }

  let source
  try {
    source = await fs.readFile(sourcePath, "utf8")
  } catch (error) {
    if (error?.code === "ENOENT") continue
    throw error
  }

  if (isRssArticle(source)) includedSlugs.add(slug)
}

if (includedSlugs.size === 0) {
  throw new Error("No content files are marked with rss: true")
}

if (!feed.includes(atomNamespace)) {
  const rssElement = /<rss\s+version="2\.0">/
  if (!rssElement.test(feed)) {
    throw new Error(`Could not find the RSS 2.0 root element in ${feedPath}`)
  }

  feed = feed.replace(rssElement, `<rss version="2.0" ${atomNamespace}>`)
}

if (!feed.includes('rel="self"')) {
  const channelElement = /<channel>\r?\n/
  if (!channelElement.test(feed)) {
    throw new Error(`Could not find the channel element in ${feedPath}`)
  }

  feed = feed.replace(channelElement, (match) => `${match}${selfLink}\n`)
}

const emittedSlugs = new Set()
feed = feed.replace(/\s*<item>[\s\S]*?<\/item>/g, (item) => {
  const link = item.match(/<link>(.*?)<\/link>/)?.[1]
  if (!link) throw new Error("Found an RSS item without a link")

  const slug = normalizeSlug(link)
  if (!includedSlugs.has(slug)) return ""

  emittedSlugs.add(slug)
  return item
})

const missingSlugs = [...includedSlugs].filter((slug) => !emittedSlugs.has(slug))
if (missingSlugs.length > 0) {
  throw new Error(`Marked RSS articles were not emitted: ${missingSlugs.join(", ")}`)
}

await fs.writeFile(feedPath, feed)
