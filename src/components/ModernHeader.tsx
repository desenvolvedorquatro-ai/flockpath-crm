import { FadeIn } from '@/components/animations/FadeIn';
import { Button } from '@/components/ui/button';
import { Plus, LucideIcon } from 'lucide-react';

interface ModernHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onAction?: () => void;
  actionText?: string;
  colorScheme?: 'blue-purple' | 'cyan-blue' | 'green-teal' | 'red-coral';
}

export function ModernHeader({
  title,
  description,
  icon: Icon,
  onAction,
  actionText = "Nova Ação",
  colorScheme = 'blue-purple'
}: ModernHeaderProps) {
  
  const colors = {
    'blue-purple': {
      iconBg: 'from-blue-500/10 to-purple-500/10',
      iconColor: 'text-blue-600',
      titleGradient: 'from-blue-600 via-blue-700 to-purple-600',
      overlayGradient: 'from-blue-500/5 to-purple-500/5',
      buttonGradient: 'from-blue-600 to-purple-600',
      buttonHover: 'hover:from-blue-700 hover:to-purple-700'
    },
    'cyan-blue': {
      iconBg: 'from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-600',
      titleGradient: 'from-cyan-600 via-blue-600 to-purple-600',
      overlayGradient: 'from-cyan-500/5 to-blue-500/5',
      buttonGradient: 'from-cyan-600 to-blue-600',
      buttonHover: 'hover:from-cyan-700 hover:to-blue-700'
    },
    'green-teal': {
      iconBg: 'from-green-500/10 to-teal-500/10',
      iconColor: 'text-green-600',
      titleGradient: 'from-green-600 via-teal-600 to-blue-600',
      overlayGradient: 'from-green-500/5 to-teal-500/5',
      buttonGradient: 'from-green-600 to-teal-600',
      buttonHover: 'hover:from-green-700 hover:to-teal-700'
    },
    'red-coral': {
      iconBg: 'from-[#b63e37]/10 to-[#8b2e29]/10',
      iconColor: 'text-[#b63e37]',
      titleGradient: 'from-[#b63e37] via-[#8b2e29] to-[#d14e47]',
      overlayGradient: 'from-[#b63e37]/5 to-[#d14e47]/5',
      buttonGradient: 'from-[#b63e37] to-[#8b2e29]',
      buttonHover: 'hover:from-[#8b2e29] hover:to-[#6f2420]'
    }
  };
  
  const scheme = colors[colorScheme];
  
  return (
    <FadeIn>
      <header className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border-0 shadow-lg mb-8">
        {/* Overlay de gradiente */}
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.overlayGradient}`} />
        
        {/* Conteúdo */}
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            
            {/* Seção Esquerda */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-4">
                {/* Ícone */}
                <div className={`p-3 bg-gradient-to-br ${scheme.iconBg} rounded-2xl border border-white/20`}>
                  <Icon className={`w-8 h-8 lg:w-10 lg:h-10 ${scheme.iconColor}`} />
                </div>
                
                {/* Texto */}
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${scheme.titleGradient} bg-clip-text text-transparent`}>
                    {title}
                  </h1>
                  <p className="text-slate-600 text-sm lg:text-base mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Seção Direita */}
            {onAction && (
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Button 
                  onClick={onAction}
                  className={`bg-gradient-to-r ${scheme.buttonGradient} ${scheme.buttonHover} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex-1 lg:flex-none`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {actionText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </FadeIn>
  );
}
