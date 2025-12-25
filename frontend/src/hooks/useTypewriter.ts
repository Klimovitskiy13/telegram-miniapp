import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // скорость печатания в мс
  delay?: number; // задержка перед началом в мс
}

export const useTypewriter = ({ text, speed = 100, delay = 0 }: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout | null = null;

    const startTyping = () => {
      typingInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          if (typingInterval) {
            clearInterval(typingInterval);
          }
        }
      }, speed);
    };

    if (delay > 0) {
      const delayTimeout = setTimeout(() => {
        startTyping();
      }, delay);
      
      return () => {
        clearTimeout(delayTimeout);
        if (typingInterval) {
          clearInterval(typingInterval);
        }
      };
    } else {
      startTyping();
      return () => {
        if (typingInterval) {
          clearInterval(typingInterval);
        }
      };
    }
  }, [text, speed, delay]);

  return { displayedText, isTyping };
};

