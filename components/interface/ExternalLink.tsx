type ExternalLinkProps = {
  href: string | null;
  children: string;
  className?: string;
};

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  if (!href) {
    return (
      <span className={className ? `${className} is-pending` : "is-pending"}>
        {children}
        <span className="pending-note">Link forthcoming</span>
      </span>
    );
  }

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
