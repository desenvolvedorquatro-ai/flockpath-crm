import ovelhaLoading from "@/assets/ovelha-loading.png";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Processando..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* Círculo de carregamento vermelho */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-40 animate-spin rounded-full border-[6px] border-transparent border-t-red-500 border-r-red-500" />
        </div>
        
        {/* Ovelha no centro */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img 
            src={ovelhaLoading} 
            alt="Processando" 
            className="h-24 w-24 object-contain"
          />
          <p className="text-gray-700 font-medium text-lg animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
