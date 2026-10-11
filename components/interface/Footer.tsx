import { socialLinks } from "@/config/site";
import { BrandIcon } from "@/components/interface/BrandIcon";

export function Footer() {
  return (
    <footer className="site-footer">
      <nav aria-label="Elsewhere">
        <ul>
          {socialLinks.map((link) => (
            <li key={link.id}>
              <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                <BrandIcon id={link.id} />
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
