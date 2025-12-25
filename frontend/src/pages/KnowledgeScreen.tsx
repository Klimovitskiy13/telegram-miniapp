/**
 * Экран знаний - статьи, советы, информация о здоровье и фитнесе
 */

import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useMemo } from 'react';
import { createGlassCardStyle } from '../utils/glassCardStyle';

export const KnowledgeScreen = () => {
  const { isDark } = useTheme();
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, '#8B5CF6'), [isDark]);

  return (
    <div className="p-6 space-y-4">
      <motion.div
        className="relative rounded-3xl p-6 w-full"
        style={{ ...cardStyle, minHeight: '200px' }}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={24} className="text-purple-400" />
          <h2 className="text-xl font-bold text-foreground">Знания</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Здесь будут статьи, советы и полезная информация о здоровье, питании и фитнесе.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={32} className="text-purple-400 opacity-60" />
          <span className="text-sm text-muted-foreground">Скоро появится</span>
        </div>
      </motion.div>
    </div>
  );
};


