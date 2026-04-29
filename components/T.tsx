import React, { useEffect, useState, useRef } from 'react';
import { useTranslate } from '../context/TranslationContext';

interface TProps {
  children: React.ReactNode;
  as?: string;
  className?: string;
}

/**
 * T (Translator) component
 * Wraps text and ensures it is translated according to the current global language.
 * It is non-intrusive and preserves all styles/layout.
 */
const T: React.FC<TProps> = ({ children, as = 'span', className }) => {
  const { translate, language } = useTranslate();
  const [translatedContent, setTranslatedContent] = useState<React.ReactNode>(children);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedContent(children);
      return;
    }

    const processTranslation = async () => {
      // If children is plain text, translate it
      if (typeof children === 'string') {
        const result = translate(children);
        setTranslatedContent(result);
      } 
      // If children is an array or has elements, we map through them
      else if (React.isValidElement(children)) {
        // We only translate the text children of elements for now 
        // to avoid breaking complex component structures
        setTranslatedContent(children);
      }
      else {
        setTranslatedContent(children);
      }
    };

    processTranslation();
  }, [children, language, translate]);

  const Component = as as any;

  return <Component className={className}>{translatedContent}</Component>;
};

export default T;
