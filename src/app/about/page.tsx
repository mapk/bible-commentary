export default function About() {
  return (
    <div className="max-w-prose mx-auto relative min-h-screen flex flex-col">
      <div className="space-y-8">
        <section>
          <h1 className="text-2xl font-semibold mb-8">About This Site</h1>
          <p className="mb-4">
            This Bible commentary site is designed to be simple and intuitive to
            use. Verses with commentary are in black text, verses without are in
            a lighter gray text. How to get started:
          </p>
          <ol className="list-decimal pl-8 space-y-2 mb-4">
            <li>Browse books of the Bible from the homepage</li>
            <li>Select a chapter to read</li>
            <li>Click on any verse to see related commentary</li>
          </ol>
          <p className="mb-4">
            The Bible presented here is the King James Version.
          </p>
          <h1 className="text-xl font-semibold mb-4">The project</h1>
          <p className="mb-4">
            This project and commentary provided comes from trusted sources
            within our community, offering insights and interpretations to help
            deepen your understanding of Scripture. It is a shared resource
            where the insights of our elders are collected, preserved, and made
            accessible to all.
          </p>
          <p className="mb-4">
            True understanding comes not just from one voice, but from the
            collective wisdom of those who guide our community. Each elder
            brings a lifetime of experience, prayer, and study to the table,
            offering interpretations that enrich our grasp of Scripture. In a
            religious community such as ours, having a single place to
            cross-reference commentary is invaluable. It allows us to see how
            different minds approach the same text, sparking dialogue, deepening
            our faith, and strengthening our unity. Whether you&apos;re seeking
            the nuance of a Hebrew term, the context of a passage, or the
            practical wisdom of an elder, this site is designed to be a resource
            you can turn to again and again.
          </p>
          <h1 className="text-xl font-semibold mb-4">Future iterations</h1>
          <p className="mb-4">
            Future iterations of this project will include multiple Bible
            versions, search functionality, commentary indicators, and more
            commentary from others.
          </p>
          <h1 className="text-xl font-semibold mb-4">The stack</h1>
          <p className="mb-4">
            This is a <code className="text-sm">NextJS</code> app written with{" "}
            <code className="text-sm">Cursor</code> using{" "}
            <code className="text-sm">Shadcn UI</code>,{" "}
            <code className="text-sm">Tailwind CSS</code>, and{" "}
            <code className="text-sm">Supabase</code>. It is hosted on{" "}
            <code className="text-sm">Netlify</code>. The King James Bible is
            sourced from <code className="text-sm">api.bible API</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
