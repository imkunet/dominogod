export default function Version() {
  return (
    <span class="version">
      {import.meta.env.PACKAGE_VERSION} {import.meta.env.COMMIT_HASH}
    </span>
  );
}
