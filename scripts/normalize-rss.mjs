import fs from "node:fs/promises"
import path from "node:path"

const feedPath = path.resolve("public/rss.xml")
const feedUrl = "https://parsalogue.com/rss.xml"
const atomNamespace = 'xmlns:atom="http://www.w3.org/2005/Atom"'
const selfLink = `      <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`

let feed = await fs.readFile(feedPath, "utf8")

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

await fs.writeFile(feedPath, feed)
