import { QuartzComponent } from "./types"

export default function LanguageRecentNotes(component: QuartzComponent): QuartzComponent {
  const RecentNotes = component
  const LocalizedRecentNotes: QuartzComponent = (props) => {
    const slug = props.fileData.slug ?? ""
    if (!slug.startsWith("parsalogue-english/")) return <RecentNotes {...props} />

    const englishArticles = props.allFiles.filter(
      (file) => file.slug?.startsWith("parsalogue-english/") && file.frontmatter?.rss === true,
    )

    return <RecentNotes {...props} allFiles={englishArticles} />
  }

  LocalizedRecentNotes.css = component.css
  LocalizedRecentNotes.beforeDOMLoaded = component.beforeDOMLoaded
  LocalizedRecentNotes.afterDOMLoaded = component.afterDOMLoaded

  return LocalizedRecentNotes
}
