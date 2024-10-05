// Credits to @jayli3n (https://github.com/jayli3n/text-truncate-scroll)
// I just converted to TypeScript + vertical-align for the <span>'s + lint errors

export interface IOptions {
    className?: string;
    scrollSpeed?: number;
    timeoutBeforeInit?: number;
}

export const activateTextTruncateScroll = (options: IOptions) => {
    const timeoutBeforeInit = (options?.timeoutBeforeInit) ?? 90;
    setTimeout(() => {
        const className = (options?.className) ?? "text-truncate-scroll";
        const elements = document.querySelectorAll(`.${className}:not([text-truncate-scroll-activated])`);
        for (const element of elements) {
            if (element.parentElement) {
                configureOneElement(element, options);
            }
        }
    }, timeoutBeforeInit);
};

const configureOneElement = (element: Element, options: IOptions) => {
    const scrollSpeed = (options?.scrollSpeed) ?? 60;
    const parentElement = element.parentElement;
    element.setAttribute("text-truncate-scroll-activated", "");
    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    span2.innerHTML = element.innerHTML;
    const elementClassName = `text-truncate-scroll-element-${generateUniqueId()}`;
    const span1ClassName = `text-truncate-scroll-span-1-${generateUniqueId()}`;
    const span2ClassName = `text-truncate-scroll-span-2-${generateUniqueId()}`;
    element.classList.add(elementClassName);
    span1.classList.add(span1ClassName);
    span2.classList.add(span2ClassName);
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    span1.appendChild(span2);
    element.appendChild(span1);
    const styles = document.createElement("style");
    styles.setAttribute("text-truncate-style-for", elementClassName);
    styles.textContent = generateStyles({ elementClassName, span1ClassName, span2ClassName });
    if (parentElement) {
        const styleElements = parentElement.getElementsByTagName("style");
        for (const styleElement of styleElements) {
            const usedByClass = styleElement.getAttribute("text-truncate-style-for");
            const usedByElements = parentElement.getElementsByClassName(usedByClass ?? "");
            
            if (!usedByElements.length) {
                parentElement.removeChild(styleElement);
            }
        }
    }
    parentElement?.insertBefore(styles, parentElement.firstChild);
    const calculate = () => {
        span2.style.width = "auto";
        const span2Width = span2.clientWidth || 0;
        const span1Width = span2.parentElement?.clientWidth ?? 0;
        const transformStyles = span2Width > span1Width ? `translateX(calc(-100% + ${span1Width}px - 5px))` : "";
        const transitionStyles = `all ${(span2Width - span1Width) / scrollSpeed}s linear`;
        styles.textContent = generateStyles({
            elementClassName,
            span1ClassName,
            span2ClassName,
            transformStyles,
            transitionStyles,
        });
        span2.style.width = "";
    };
    const resizeObserver = new ResizeObserver(calculate);
    resizeObserver.observe(element);
    calculate();
};

interface generateStyles {
    elementClassName: string;
    span1ClassName: string;
    span2ClassName: string;
    transformStyles?: string;
    transitionStyles?: string;
}

const generateStyles = (styles: generateStyles) => `
.${styles.elementClassName} {
    display: grid;
}

.${styles.span1ClassName} {
    display: inline-block;
    width: 100%;
    vertical-align: top;
    overflow: hidden;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
}

.${styles.elementClassName}:hover .${styles.span1ClassName}, 
.${styles.elementClassName}:focus .${styles.span1ClassName}, 
.${styles.elementClassName}:active .${styles.span1ClassName} {
    width: auto;
}

.${styles.span2ClassName} {
    position: relative;
    display: inline-block;
    left: 0px;
    width: 100%;
    vertical-align: top;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
}

.${styles.elementClassName}:hover .${styles.span2ClassName}, 
.${styles.elementClassName}:focus .${styles.span2ClassName}, 
.${styles.elementClassName}:active .${styles.span2ClassName} {
    width: auto;
    transform: ${styles.transformStyles ?? ""};
    transition: ${styles.transitionStyles ?? ""};
}`;

const generateUniqueId = () => {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomNum}`;
};
