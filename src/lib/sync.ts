import { localDb, type FormRecord } from './db';
import { supabase } from './supabase';

/**
 * Verifica conectividade de forma segura em qualquer ambiente
 * - Browser/PWA: usa navigator.onLine (nativo do browser)
 * - App nativo (Capacitor): tenta Network plugin, cai para navigator.onLine
 */
async function isNetworkConnected(): Promise<boolean> {
  // Sempre confia no navigator.onLine como fonte primária no browser
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    // Tenta o plugin Capacitor (funciona em APK, não no browser)
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    // Fallback seguro para ambientes web
    return navigator.onLine;
  }
}

export async function syncFormsWithSupabase() {
  const connected = await isNetworkConnected();
  if (!connected) {
    console.log('[Sync] Offline - sync ignorado');
    return;
  }

  try {
    // 1. Enviar os forms que estão 'pending' para o Supabase
    const pendingForms = await localDb.forms.where('syncStatus').equals('pending').toArray();
    
    console.log(`[Sync] Enviando ${pendingForms.length} form(s) pendente(s)...`);

    for (const form of pendingForms) {
      // Remove syncStatus before sending to Supabase
      const { syncStatus, ...dataToSync } = form;
      
      const { error } = await supabase
        .from('forms')
        .upsert(dataToSync, { onConflict: 'id' });
        
      if (!error) {
        await localDb.forms.update(form.id, { syncStatus: 'synced' });
        console.log(`[Sync] ✓ Form ${form.tag} sincronizado`);
      } else {
        console.error('[Sync] ✗ Erro ao sincronizar form', form.id, error.message, error.details);
      }
    }

    // 2. Buscar atualizações do Supabase (para outros dispositivos)
    const { data: remoteForms, error: fetchError } = await supabase
      .from('forms')
      .select('*');

    if (fetchError) {
      console.error('[Sync] Erro ao buscar dados remotos:', fetchError.message);
      return;
    }

    if (remoteForms && remoteForms.length > 0) {
      await localDb.transaction('rw', localDb.forms, async () => {
        for (const remote of remoteForms) {
          const local = await localDb.forms.get(remote.id);
          if (!local || new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
            await localDb.forms.put({
              ...remote,
              syncStatus: 'synced'
            } as FormRecord);
          }
        }
      });
      console.log(`[Sync] ✓ ${remoteForms.length} form(s) recebido(s) do Supabase`);
    }

  } catch (error) {
    console.error('[Sync] Falha geral na sincronização:', error);
  }
}

// Configurar o listener de mudanças em tempo real (Realtime Supabase)
export function setupRealtimeSync(onUpdate: () => void) {
  const channel = supabase
    .channel('public:forms')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'forms' }, async (_payload) => {
      await syncFormsWithSupabase();
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
