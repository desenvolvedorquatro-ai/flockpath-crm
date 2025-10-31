import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function useSessionTimeout() {
  const navigate = useNavigate();
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // padrão 30 min
  const [inactivityEnabled, setInactivityEnabled] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Carregar configuração de timeout do banco
  useEffect(() => {
    const fetchSessionConfig = async () => {
      const { data } = await supabase
        .from('system_config')
        .select('config_key, config_value')
        .in('config_key', ['session_timeout_minutes', 'session_inactivity_timeout']);
      
      if (data) {
        data.forEach((config) => {
          if (config.config_key === 'session_timeout_minutes') {
            setSessionTimeout(parseInt(config.config_value));
          }
          if (config.config_key === 'session_inactivity_timeout') {
            setInactivityEnabled(config.config_value === 'true');
          }
        });
      }
    };
    
    fetchSessionConfig();
  }, []);

  // Resetar timer de inatividade
  const resetTimer = () => {
    if (!inactivityEnabled) return;
    
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      toast({
        title: "Sessão expirada",
        description: `Sua sessão expirou após ${sessionTimeout} minutos de inatividade`,
        variant: "destructive",
      });
      navigate('/auth');
    }, sessionTimeout * 60 * 1000); // converter minutos para milissegundos
  };

  // Monitorar atividade do usuário
  useEffect(() => {
    if (!inactivityEnabled) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer(); // Iniciar timer

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionTimeout, inactivityEnabled]);

  return { sessionTimeout, setSessionTimeout };
}
