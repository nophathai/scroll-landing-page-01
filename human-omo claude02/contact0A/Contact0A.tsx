import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Props = {
    headline: string
    linkedinHref: string
    resumeHref: string
}

export default function Contact0A({
    headline = "Feel free to\ncontact me",
    linkedinHref = "https://www.linkedin.com/in/nophathai-vasasmith",
    resumeHref = "https://drive.google.com/file/d/1AWzAorv_-3degF5769R7MCqNyC6ZUAth/view?usp=sharing",
}: Props) {
    return (
        <section style={styles.section} aria-label="Contact">
            <style>{css}</style>
            <div className="c0a-copy">
                <h2>{headline}</h2>
                <div className="c0a-actions">
                    <a className="c0a-button" href={linkedinHref} target="_blank" rel="noreferrer">
                        Linkedin
                    </a>
                    <a className="c0a-button" href={resumeHref} target="_blank" rel="noreferrer">
                        Resume
                    </a>
                </div>
            </div>
        </section>
    )
}

const styles: Record<string, React.CSSProperties> = {
    section: {
        position: "relative",
        display: "grid",
        alignItems: "center",
        justifyItems: "end",
        width: "100%",
        minHeight: 420,
        padding: "clamp(40px, 8vw, 96px) clamp(20px, 7vw, 96px)",
        background: "transparent",
        overflow: "hidden",
        fontFamily:
            '"DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
}

const css = `
.c0a-copy {
    display: grid;
    justify-items: start;
    width: min(460px, 100%);
}

.c0a-copy h2 {
    margin: 0 0 30px;
    white-space: pre-line;
    color: #101010;
    font-family: "Space Grotesk", "DM Sans", Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: clamp(54px, 6vw, 78px);
    font-weight: 950;
    line-height: 1.15;
    letter-spacing: 0;
}

.c0a-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
}

.c0a-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 0 28px;
    border: 1px solid rgba(16, 16, 16, 0.14);
    border-radius: 999px;
    background: #fff;
    color: #101010;
    font-size: 14px;
    font-weight: 400;
    line-height: 1;
    text-decoration: none;
    box-shadow: 0 10px 28px rgba(16, 16, 16, 0.08);
    transition: color 260ms cubic-bezier(0.22, 1, 0.36, 1), background 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.c0a-button:hover {
    background: #101010;
    color: #fff;
    box-shadow: 0 18px 48px rgba(16, 16, 16, 0.16);
}

.c0a-button:active {
    transform: scale(0.98);
}

@media (max-width: 760px) {
    .c0a-copy {
        justify-items: center;
        text-align: center;
    }

    .c0a-copy h2 {
        font-size: clamp(42px, 13vw, 58px);
    }

    .c0a-actions {
        justify-content: center;
    }
}
`

addPropertyControls(Contact0A, {
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Feel free to\ncontact me",
        displayTextArea: true,
    },
    linkedinHref: {
        type: ControlType.String,
        title: "LinkedIn",
        defaultValue: "https://www.linkedin.com/in/nophathai-vasasmith",
    },
    resumeHref: {
        type: ControlType.String,
        title: "Resume",
        defaultValue:
            "https://drive.google.com/file/d/1AWzAorv_-3degF5769R7MCqNyC6ZUAth/view?usp=sharing",
    },
})
