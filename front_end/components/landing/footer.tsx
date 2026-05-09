import Link from 'next/link'
import { FileText, Github, Twitter, Linkedin } from 'lucide-react'

const footerLinks = {
  produto: [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Segurança', href: '#seguranca' },
    { label: 'Roadmap', href: 'https://github.com/openmanifest/roadmap' },
  ],
  recursos: [
    { label: 'Documentação', href: 'https://docs.openmanifest.com.br' },
    { label: 'API Reference', href: 'https://api.openmanifest.com.br/docs' },
    { label: 'Status', href: 'https://status.openmanifest.com.br' },
    { label: 'Changelog', href: 'https://github.com/openmanifest/releases' },
  ],
  comunidade: [
    { label: 'GitHub', href: 'https://github.com/openmanifest/openmanifest' },
    { label: 'Contribuir', href: 'https://github.com/openmanifest/openmanifest/blob/main/CONTRIBUTING.md' },
    { label: 'Discussões', href: 'https://github.com/openmanifest/openmanifest/discussions' },
    { label: 'Issues', href: 'https://github.com/openmanifest/openmanifest/issues' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Licença MIT', href: 'https://github.com/openmanifest/openmanifest/blob/main/LICENSE' },
  ],
}

const socialLinks = [
  { icon: Github, href: 'https://github.com/openmanifest', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com/openmanifest', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/openmanifest', label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 md:py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold">OpenManifest</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Plataforma open source gratuita para gestão de notas fiscais eletrônicas.
            </p>
            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Recursos</h3>
            <ul className="space-y-3">
              {footerLinks.recursos.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Comunidade</h3>
            <ul className="space-y-3">
              {footerLinks.comunidade.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} OpenManifest. Distribuído sob licença MIT.
          </p>
          <p className="text-sm text-muted-foreground">
            Feito com carinho pela comunidade open source brasileira
          </p>
        </div>
      </div>
    </footer>
  )
}
