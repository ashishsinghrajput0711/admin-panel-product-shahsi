"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

type ProductPageMotionProps = {
  children: ReactNode;
  className?: string;
};



const CARD_SELECTOR = [
  "section",
  "article",
  "[data-product-section]",
  "form > div[class*='rounded-']",
  "form > div > div[class*='rounded-']",
].join(", ");

const CONTROL_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='combobox']",
].join(", ");

const PRIMARY_ACTION_PATTERN =
  /save product|save pricing|save commerce|save fit data|save seo|save tags|save metafields/i;

export function ProductPageMotion({
  children,
  className = "",
}: ProductPageMotionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const root = rootRef.current;

  if (!root) {
    return;
  }

  const pageRoot: HTMLDivElement = root;

  const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observedCards = new WeakSet<HTMLElement>();

    const intersectionObserver = reduceMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }

              const element = entry.target as HTMLElement;

              element.dataset.productMotionVisible = "true";
              intersectionObserver?.unobserve(element);
            });
          },
          {
            threshold: 0.06,
            rootMargin: "0px 0px -6% 0px",
          },
        );

    function isUsableCard(element: HTMLElement) {
      if (element.hasAttribute("data-no-page-motion")) {
        return false;
      }

      const classNameValue =
        typeof element.className === "string" ? element.className : "";

      if (
        classNameValue.includes("fixed") ||
        classNameValue.includes("sticky")
      ) {
        return false;
      }

      const tagName = element.tagName.toLowerCase();

      if (
        ["button", "input", "textarea", "select", "option"].includes(tagName)
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();

      if (rect.width < 240 || rect.height < 70) {
        return false;
      }

      const isExplicitCard = element.matches(
        "section, article, [data-product-section]",
      );

      /*
       * Generic rounded wrapper ke andar agar already proper section hai,
       * to outer wrapper ko duplicate animation nahi denge.
       */
      if (
        !isExplicitCard &&
        element.querySelector(
          "section, article, [data-product-section]",
        )
      ) {
        return false;
      }

      return true;
    }

    function decorateCards() {
      const candidates = Array.from(
     pageRoot.querySelectorAll<HTMLElement>(CARD_SELECTOR)
      );

      let animationIndex = 0;

      candidates.forEach((element) => {
        if (observedCards.has(element)) {
          return;
        }

        if (!isUsableCard(element)) {
          return;
        }

        observedCards.add(element);

        element.dataset.productMotionCard = "true";

      element.style.setProperty(
  "--product-motion-order",
  String(animationIndex % 12),
);

        animationIndex += 1;

        if (reduceMotion) {
          element.dataset.productMotionVisible = "true";
        } else {
          intersectionObserver?.observe(element);
        }
      });
    }

    function decorateControls() {
    pageRoot
  .querySelectorAll<HTMLElement>(CONTROL_SELECTOR)
        .forEach((element) => {
          if (element.hasAttribute("data-no-page-motion")) {
            return;
          }

          element.dataset.productMotionControl = "true";
        });
    }

    function decorateButtons() {
      pageRoot.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if (button.hasAttribute("data-no-page-motion")) {
          return;
        }

        button.dataset.productMotionButton = "true";

        const buttonText = button.textContent?.trim() ?? "";

        if (PRIMARY_ACTION_PATTERN.test(buttonText)) {
          button.dataset.productMotionPrimaryAction = "true";
        }

        if (/save product/i.test(buttonText)) {
          const saveBar =
            (button.closest(
              "[class*='fixed'], [class*='sticky']",
            ) as HTMLElement | null) ?? button.parentElement;

          if (saveBar) {
            saveBar.dataset.productMotionSaveBar = "true";
          }
        }
      });
    }

    function decorateImages() {
    pageRoot.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
        if (image.hasAttribute("data-no-page-motion")) {
          return;
        }

        image.dataset.productMotionImage = "true";
      });
    }

    function decorateHeader() {
   const heading = pageRoot.querySelector<HTMLElement>("h1");

      const headingWrapper = heading?.parentElement;

      if (headingWrapper) {
        headingWrapper.dataset.productMotionHeader = "true";
      }
    }

    function decoratePage() {
      decorateCards();
      decorateControls();
      decorateButtons();
      decorateImages();
      decorateHeader();
    }

    decoratePage();

    const frameId = window.requestAnimationFrame(() => {
   pageRoot.dataset.productMotionReady = "true";
    });

    /*
     * Product metafields, taxonomy fields, media, picker data etc.
     * API se baad me render ho sakte hain.
     * MutationObserver unko bhi automatically decorate karega.
     */
    let mutationFrameId: number | null = null;

    const mutationObserver = new MutationObserver(() => {
      if (mutationFrameId !== null) {
        window.cancelAnimationFrame(mutationFrameId);
      }

      mutationFrameId = window.requestAnimationFrame(() => {
        decoratePage();
        mutationFrameId = null;
      });
    });

  mutationObserver.observe(pageRoot, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frameId);

      if (mutationFrameId !== null) {
        window.cancelAnimationFrame(mutationFrameId);
      }

      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`product-editor-motion ${className}`.trim()}
    >
      {children}
    </div>
  );
}