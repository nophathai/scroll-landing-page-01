import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type ProjectItem = {
    label: string
    href: string
    image?: string
}

const projects: ProjectItem[] = [
    {
        label: "Alpha SME",
        href: "https://nophathai.design/alphasme",
        image: "reference/main_projects/alphaSME.avif",
    },
    {
        label: "Eastspring M ChoiceTH",
        href: "https://nophathai.design/eastspring",
        image: "reference/main_projects/EastspingTH.avif",
    },
    {
        label: "Principal TH",
        href: "https://nophathai.design/principal",
        image: "reference/main_projects/principalTH.avif",
    },
]

type Props = {
    logo: string
    homeHref: string
    resumeHref: string
}

export default function Navbar0A({
    logo = "Logo.png",
    homeHref = "/",
    resumeHref = "https://drive.google.com/file/d/1AWzAorv_-3degF5769R7MCqNyC6ZUAth/view?usp=sharing",
}: Props) {
    return (
        <header style={styles.header}>
            <style>{css}</style>
            <a className="n0a-logo" href={homeHref} aria-label="Go to Home">
                <img src={logo} alt="Nophathai" style={styles.logoImage} />
            </a>
            <nav className="n0a-menu" aria-label="Main navigation">
                <div className="n0a-projectMenu">
                    <a className="n0a-link" href="#first-projectsme">
                        Projects
                    </a>
                    <div className="n0a-dropdown" aria-label="Project links">
                        {projects.map((project) => (
                            <a className="n0a-project" href={project.href} key={project.href}>
                                {project.image ? <img src={project.image} alt="" /> : null}
                                <span>{project.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
                <a className="n0a-link" href={resumeHref} target="_blank" rel="noreferrer">
                    Resume
                </a>
            </nav>
        </header>
    )
}

const styles: Record<string, React.CSSProperties> = {
    header: {
        position: "relative",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "clamp(16px, 2vw, 24px) clamp(18px, 3.2vw, 34px)",
        fontFamily:
            '"DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        pointerEvents: "none",
    },
    logoImage: {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },
}

const css = `
.n0a-logo,
.n0a-link {
    pointer-events: auto;
    color: #000;
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
    text-decoration: none;
    transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.n0a-logo:hover,
.n0a-link:hover {
    opacity: 0.7;
}

.n0a-logo {
    display: block;
    width: clamp(54px, 5.2vw, 74px);
    aspect-ratio: 171 / 72;
}

.n0a-menu {
    display: flex;
    align-items: center;
    gap: clamp(20px, 3vw, 32px);
}

.n0a-projectMenu {
    position: relative;
    pointer-events: auto;
}

.n0a-dropdown {
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    display: grid;
    grid-template-columns: repeat(3, 200px);
    gap: 12px;
    padding: 12px;
    border: 1px solid rgba(140, 92, 255, 0.14);
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 248, 255, 0.98)), #fff;
    box-shadow: 0 28px 90px rgba(44, 59, 99, 0.18);
    opacity: 0;
    visibility: hidden;
    transform: translate3d(0, -8px, 0) scale(0.98);
    transition: opacity 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), visibility 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.n0a-projectMenu:hover .n0a-dropdown,
.n0a-projectMenu:focus-within .n0a-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translate3d(0, 0, 0) scale(1);
}

.n0a-project {
    display: grid;
    gap: 10px;
    padding: 8px;
    border-radius: 18px;
    color: #101010;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.15;
    text-decoration: none;
    transition: background-color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.n0a-project:hover {
    background: linear-gradient(135deg, rgba(53, 200, 255, 0.14), rgba(255, 111, 183, 0.12));
}

.n0a-project img {
    width: 200px;
    aspect-ratio: 1;
    border-radius: 16px;
    object-fit: cover;
}

@media (max-width: 980px) {
    .n0a-dropdown {
        position: fixed;
        top: 58px;
        left: 50%;
        right: auto;
        grid-template-columns: repeat(3, 128px);
        gap: 10px;
        width: max-content;
        max-width: calc(100vw - 32px);
        transform: translate3d(-50%, -8px, 0) scale(0.98);
    }

    .n0a-projectMenu:hover .n0a-dropdown,
    .n0a-projectMenu:focus-within .n0a-dropdown {
        transform: translate3d(-50%, 0, 0) scale(1);
    }

    .n0a-project {
        justify-items: center;
        text-align: center;
    }

    .n0a-project img {
        width: 128px;
        border-radius: 14px;
    }
}

@media (max-width: 760px) {
    .n0a-dropdown {
        top: 54px;
        left: 50%;
        right: auto;
        grid-template-columns: 1fr;
        width: min(280px, calc(100vw - 36px));
        padding: 10px;
    }

    .n0a-project {
        min-height: 42px;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.58);
    }

    .n0a-project img {
        display: none;
    }
}
`

addPropertyControls(Navbar0A, {
    logo: {
        type: ControlType.Image,
        title: "Logo",
    },
    homeHref: {
        type: ControlType.String,
        title: "Home Link",
        defaultValue: "/",
    },
    resumeHref: {
        type: ControlType.String,
        title: "Resume Link",
        defaultValue:
            "https://drive.google.com/file/d/1AWzAorv_-3degF5769R7MCqNyC6ZUAth/view?usp=sharing",
    },
})
