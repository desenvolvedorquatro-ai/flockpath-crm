import ovelhaLoading from "@/assets/ovelha-loading.png";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Processando..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        {/* Círculo de carregamento com ovelha centralizada */}
        <div className="relative flex items-center justify-center h-40 w-40">
          <div className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-t-red-500 border-r-red-500" />
          <img 
            src={ovelhaLoading} 
            alt="Processando" 
            className="h-24 w-24 object-contain animate-pulse"
          />
        </div>
        
        {/* Texto abaixo do círculo */}
        <p className="text-gray-700 font-medium text-lg animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
