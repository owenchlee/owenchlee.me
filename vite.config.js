import { defineConfig, createServer } from 'vite'
import react from '@vitejs/plugin-react'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const a = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`

// Build-time <noscript> fallback generated from content.js so crawlers and
// no-JS visitors see the same facts as the app and the text can't drift.
function noscriptContent() {
  return {
    name: 'noscript-content',
    apply: 'build',
    async transformIndexHtml(html) {
      const server = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        configFile: false,
        logLevel: 'silent',
        optimizeDeps: { noDiscovery: true },
      })
      let c
      try {
        c = await server.ssrLoadModule('/src/content.js')
      } finally {
        await server.close()
      }
      const { INTRO, EDUCATION, EXPERIENCE, PROJECTS, HOBBIES, CONTACT, RESUME_URL } = c
      const plain = (s) => esc(s.replace(/\*\*/g, ''))
      const body = `<noscript>
      <main>
        <h1>${esc(INTRO.name)}</h1>
        <p>${esc(INTRO.roleTitle)}, ${esc(INTRO.roleOrg)}. ${esc(INTRO.status)}.</p>
        <p>${esc(INTRO.bio)}</p>
        <ul>${INTRO.highlights.map((h) => `<li>${plain(h)}</li>`).join('')}</ul>
        <h2>Projects</h2>
        <ul>${PROJECTS.map(
          (p) =>
            `<li><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>${[p.link && a(p.link, 'Repo / source'), p.live && a(p.live, 'Live site')]
              .filter(Boolean)
              .join(' ')}</li>`,
        ).join('')}</ul>
        <h2>Experience</h2>
        <ul>${EXPERIENCE.map((e) => `<li>${esc(e.role)}, ${esc(e.org)} (${esc(e.dates)})</li>`).join('')}</ul>
        <h2>Education</h2>
        <ul>${EDUCATION.map((e) => `<li>${esc(e.program)}, ${esc(e.school)} (${esc(e.dates)})</li>`).join('')}</ul>
        <h2>Hobbies</h2>
        <ul>${HOBBIES.map((h) => `<li>${esc(h.label)}</li>`).join('')}</ul>
        <h2>Contact</h2>
        <p>${a(RESUME_URL, 'Resume (PDF)')} ${a(`mailto:${CONTACT.email}`, CONTACT.email)} ${CONTACT.links
          .map((l) => a(l.href, l.label))
          .join(' ')}</p>
      </main>
    </noscript>`
      return html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${body}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), noscriptContent()],
  build: { target: 'esnext', assetsInlineLimit: 0 },
})
