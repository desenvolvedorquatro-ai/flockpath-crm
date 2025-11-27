import ovelhaLoading from "@/assets/ovelha-loading.png";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Processando..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* Círculo de carregamento vermelho */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-4 border-transparent border-t-red-500 border-r-red-500" />
        </div>
        
        {/* Ovelha no centro */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img 
            src={ovelhaLoading} 
            alt="Processando" 
            className="h-20 w-20"
          />
          <p className="text-white font-medium text-lg animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
