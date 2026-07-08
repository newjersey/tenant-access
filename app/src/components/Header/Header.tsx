import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@/components/Header/Header.css";
import content from "@/data/content/en/common.json";

/**
 * Header component for displaying the header content
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleMenuOpen = () => {
    setIsMenuOpen(true);
  };

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        handleMenuClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, handleMenuClose]);

  useEffect(() => {
    if (isMenuOpen) {
      closeButtonRef.current?.focus();
    } else {
      if (document.activeElement === closeButtonRef.current) {
        menuButtonRef.current?.focus();
      }
    }
  }, [isMenuOpen]);

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Overlay click is supplementary - primary close methods are button and Escape key */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Overlay click is supplementary - primary close methods are button and Escape key */}
      <div
        className={isMenuOpen ? "usa-overlay is-visible" : "usa-overlay"}
        onClick={handleMenuClose}
      ></div>
      <header className="usa-header usa-header--basic">
        <div className="usa-nav-container">
          <div className="usa-navbar njhmf-navbar">
            <div className="usa-logo" id="basic-logo">
              <em className="usa-logo__text">
                <Link to="/" className="display-flex flex-align-center">
                  <img className="njhmf-logo" src="/images/logo-img.jpg" alt="NJHMF logo" />
                  {content.header.agencyName}
                </Link>
              </em>
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              className="usa-menu-btn"
              onClick={handleMenuOpen}
              aria-expanded={isMenuOpen}
              aria-controls="basic-nav-section"
            >
              {content.header.menuText}
            </button>
          </div>
          <nav
            id="basic-nav-section"
            aria-label="Primary navigation"
            className={isMenuOpen ? "usa-nav is-visible" : "usa-nav"}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="usa-nav__close"
              aria-label="Close navigation"
              onClick={handleMenuClose}
            >
              <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
                <use xlinkHref="/images/sprite.svg#close"></use>
              </svg>
            </button>

            <ul className="usa-nav__primary usa-accordion">
              <li className="usa-nav__primary-item">
                <Link to="/register" className="usa-nav__link" onClick={handleMenuClose}>
                  <span>{content.header.register}</span>
                </Link>
              </li>
              <li className="usa-nav__primary-item">
                <Link to="/signin" className="usa-nav__link" onClick={handleMenuClose}>
                  <span>{content.header.signin}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
