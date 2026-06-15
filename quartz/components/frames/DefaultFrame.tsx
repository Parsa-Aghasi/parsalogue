import { PageFrame, PageFrameProps } from "./types"
import HeaderConstructor from "../Header"

const Header = HeaderConstructor()

/**
 * The default page frame — three-column layout with left sidebar, center
 * content (header + body + afterBody), and right sidebar, followed by a footer.
 *
 * This is the original Quartz layout, extracted from renderPage.tsx.
 */
export const DefaultFrame: PageFrame = {
  name: "default",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
  }: PageFrameProps) {
    return (
      <>
        <input
          id="collapse-left-sidebar"
          class="sidebar-collapse-state left-state"
          type="checkbox"
          aria-label="Collapse left sidebar"
        />
        <input
          id="collapse-right-sidebar"
          class="sidebar-collapse-state right-state"
          type="checkbox"
          aria-label="Collapse right sidebar"
        />
        <label
          class="sidebar-collapse-toggle left-toggle"
          for="collapse-right-sidebar"
          title="Collapse left sidebar"
          aria-label="Collapse left sidebar"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <rect x="2.5" y="3" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" />
            <path d="M7 3v12" stroke="currentColor" />
            <path
              d="M11.5 6.5 9 9l2.5 2.5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </label>
        <label
          class="sidebar-collapse-toggle right-toggle"
          for="collapse-left-sidebar"
          title="Collapse right sidebar"
          aria-label="Collapse right sidebar"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <rect x="2.5" y="3" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" />
            <path d="M11 3v12" stroke="currentColor" />
            <path
              d="M6.5 6.5 9 9l-2.5 2.5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </label>
        <div class="left sidebar">
          {left.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        <div class="center">
          <div class="page-header">
            <Header {...componentData}>
              {header.map((HeaderComponent) => (
                <HeaderComponent {...componentData} />
              ))}
            </Header>
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
          </div>
          <Content {...componentData} />
          <div class="page-footer">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </div>
        <div class="right sidebar">
          {right.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        <Footer {...componentData} />
      </>
    )
  },
}
