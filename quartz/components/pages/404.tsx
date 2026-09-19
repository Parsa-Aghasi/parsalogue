import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const configuredBaseDir = url.pathname === "/" ? "/" : url.pathname
  const baseDir = configuredBaseDir

  return (
    <article class="not-found-page popover-hint">
      <p class="not-found-page__code" aria-hidden="true">
        404
      </p>
      <div class="not-found-page__message" lang="en" dir="ltr">
        <h1>Page not found</h1>
        <p>This page is private or does not exist.</p>
      </div>
      <div class="not-found-page__divider" aria-hidden="true" />
      <div class="not-found-page__message" lang="fa" dir="rtl">
        <h2>صفحه پیدا نشد</h2>
        <p>این صفحه خصوصی است یا وجود ندارد.</p>
      </div>
      <a class="not-found-page__home" href={baseDir}>
        <span lang="en" dir="ltr">
          Return home
        </span>
        <span aria-hidden="true">/</span>
        <span lang="fa" dir="rtl">
          بازگشت به صفحه اصلی
        </span>
      </a>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          if (typeof fetchData !== "undefined") {
            fetchData.then(function(index) {
              var basePath = document.body.dataset.basepath || ${JSON.stringify(configuredBaseDir)};
              if (basePath.length > 1 && basePath.endsWith("/")) {
                basePath = basePath.slice(0, -1);
              }
              var pathname = window.location.pathname;
              var hasBasePrefix =
                basePath.length > 1 && (pathname === basePath || pathname.startsWith(basePath + "/"));
              if (hasBasePrefix) {
                pathname = pathname.slice(basePath.length);
              }
              if (pathname.startsWith("/")) {
                pathname = pathname.slice(1);
              }
              if (pathname.endsWith("/")) {
                pathname = pathname.slice(0, -1);
              }
              if (pathname.endsWith(".html")) {
                pathname = pathname.slice(0, -5);
              }
              if (pathname.endsWith("/index")) {
                pathname = pathname.slice(0, -6);
              }
              try {
                pathname = decodeURIComponent(pathname);
              } catch {}
              if (!hasBasePrefix && basePath.length > 1 && index[pathname] != null) {
                window.location.replace(basePath + "/" + pathname);
                return;
              }
              var lowered = pathname.toLowerCase();
              if (lowered !== pathname && index[lowered] != null) {
                var prefix = hasBasePrefix ? basePath : "";
                var target = prefix + (prefix.endsWith("/") ? "" : "/") + lowered;
                window.location.replace(target);
              }
            });
          }
          `,
        }}
      />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
