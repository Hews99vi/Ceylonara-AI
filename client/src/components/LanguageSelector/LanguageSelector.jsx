import { useTranslation } from 'react-i18next';
import './languageSelector.css';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Store the language preference in localStorage
    localStorage.setItem('language', lng);
  };

  return (
    <div className="languageSelector">
      <button 
        className={i18n.language === 'en' ? 'active' : ''} 
        onClick={() => changeLanguage('en')}
      >
        {t('language.english')}
      </button>
      <button 
        className={i18n.language === 'si' ? 'active' : ''} 
        onClick={() => changeLanguage('si')}
      >
        {t('language.sinhala')}
      </button>
    </div>
  );
};

export default LanguageSelector;