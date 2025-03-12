export default function About() {
  return (
    <div className="max-w-prose mx-auto relative min-h-screen flex flex-col">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Use This Site</h2>
          <p className="mb-4">
            This Bible commentary site is designed to be simple and intuitive to
            use. How to get started:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Browse books of the Bible from the homepage</li>
            <li>Select a chapter to read</li>
            <li>Click on any verse to see related commentary</li>
            <li>Use the search bar to find specific passages or topics</li>
          </ul>
          <p className="mb-4">
            The commentary provided comes from trusted sources within our
            community, offering insights and interpretations to help deepen your
            understanding of the scripture.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">About the Project</h2>
          <p className="mb-4">
            This project is a place for thoughtful commentary on the Bible,
            rooted in the wisdom of our community&apos;s eldership. It began
            with my own reflections, and I hope will grow into something much
            larger: a shared resource where the insights of our elders are
            collected, preserved, and made accessible to all.
          </p>
          <p className="mb-4">
            Much of the commentary here reflects my own exploration of these
            ancient words and their enduring relevance. But I believe that true
            understanding comes not just from one voice, but from the collective
            wisdom of those who guide our community. That&apos;s why I&apos;m
            inviting our elders to contribute their perspectives. Each brings a
            lifetime of experience, prayer, and study to the table, offering
            interpretations that enrich our grasp of Scripture.
          </p>
          <p>
            In a growing religious community like ours, having a single place to
            cross-reference commentary is invaluable. It allows us to see how
            different minds approach the same text, sparking dialogue, deepening
            our faith, and strengthening our unity. Whether you&apos;re seeking
            the nuance of a Hebrew term, the context of a passage, or the
            practical wisdom of an elder, this site is designed to be a resource
            you can turn to again and again.
          </p>
        </section>
      </div>
    </div>
  );
}
