import { Link, Outlet } from "react-router-dom";
import "./rootLayout.css";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";

const RootLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="rootLayout">
      <header>
        <Link to="/" className="logo">
          <img src="/logo.png" alt="" />
          <span>Ceylonara</span>
        </Link>
        <div className="user">
          <LanguageSelector />
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;