export default function Guide() {
  return (
    <div className="max-w-prose mx-auto relative min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold my-8">Guide</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Use This Site</h2>
          <p className="mb-4">
            This Bible commentary site is designed to be simple and intuitive to
            use. Here's how to get started:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Browse books of the Bible from the homepage</li>
            <li>Select a chapter to read</li>
            <li>Click on any verse to see related commentary</li>
            <li>Use the search bar to find specific passages or topics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Understanding the Commentary
          </h2>
          <p>
            The commentary provided comes from trusted sources within our
            community, offering insights and interpretations to help deepen your
            understanding of the scripture.
          </p>
        </section>
      </div>
    </div>
  );
}
