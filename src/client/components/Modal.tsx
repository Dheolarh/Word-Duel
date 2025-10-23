import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { SoundButton } from './SoundButton';

interface ModalProps {
  title?: string;
  headerImage?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ title, headerImage, children, onClose }: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm bg-white rounded-xl shadow-xl max-h-[85vh] overflow-y-auto"
      >
        {headerImage ? (
          <div className="relative flex items-center justify-center pt-3 pb-2">
            <img src={headerImage} alt={title} className="h-10 max-w-[80%]" />
            <SoundButton
              onClick={onClose}
              className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </SoundButton>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            {title && <h3 className="text-base">{title}</h3>}
            <SoundButton
              onClick={onClose}
              className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </SoundButton>
          </div>
        )}
        <div className="p-3">{children}</div>
      </motion.div>
    </motion.div>
  );
}
