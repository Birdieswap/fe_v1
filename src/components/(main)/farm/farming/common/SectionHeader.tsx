export function SectionHeader(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) {
  return <h1 className="text-sm font-bold text-default-800 pl-2" {...props} />;
}
