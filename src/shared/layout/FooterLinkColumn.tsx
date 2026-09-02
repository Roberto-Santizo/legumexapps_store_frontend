import { Link } from "react-router-dom"

type FooterLink = {
    label: string
    url?: string
    external?: boolean
}

type FooterLinkColumnProps = {
    title: string
    links: FooterLink[]
}

function renderFooterLink(link: FooterLink) {
    if (!link.url) {
        return <span className="text-sm text-crema/85">{link.label}</span>
    }
    if (link.external) {
        return (
            <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-crema/85 transition hover:text-dorado"
            >
                {link.label}
            </a>
        )
    }
    return (
        <Link to={link.url} className="text-sm text-crema/85 transition hover:text-dorado">
            {link.label}
        </Link>
    )
}

export function FooterLinkColumn({ title, links }: Readonly<FooterLinkColumnProps>) {
    return (
        <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-crema/60">{title}</h3>
            <ul className="mt-4 space-y-3">
                {links.map((link) => <li key={link.label}>{renderFooterLink(link)}</li>)}
            </ul>
        </div>
    )
}
