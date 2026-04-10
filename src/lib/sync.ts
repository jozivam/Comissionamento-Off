import { localDb, type FormRecord } from './db';
import { supabase } from './supabase';
import { Network } from '@capacitor/network';

export async function syncFormsWithSupabase() {
  const status = await Network.getStatus();
  if (!status.connected) return;

  try {
    // 1. Enviar os forms que estão 'pending' para o Supabase
    const pendingForms = await localDb.forms.where('syncStatus').equals('pending').toArray();
    
    for (const form of pendingForms) {
      // Remove syncStatus before sending to Supabase
      const { syncStatus, ...dataToSync } = form;
      
      const { error } = await supabase
        .from('forms')
        .upsert(dataToSync, { onConflict: 'id' });
        
      if (!error) {
        await localDb.forms.update(form.id, { syncStatus: 'synced' });
      } else {
        console.error('Erro ao sincronizar form ', form.id, error);
      }
    }

    // 2. Buscar atualizações do Supabase (para pegar forms de outros dispositivos ou offline)
    // Buscamos dados modificados desde a ultima vez (poderia ser otimizado guardando a ultima timestamp, 
    // mas para garantir buscaremos os recentes ou todos os do usuário logado se houvesse auth. 
    // Como é offline-first, buscaremos todos - ajustar conforme o volume)
    const { data: remoteForms, error: fetchError } = await supabase
      .from('forms')
      .select('*');

    if (!fetchError && remoteForms) {
      // Comparar e salvar no banco local
      await localDb.transaction('rw', localDb.forms, async () => {
        for (const remote of remoteForms) {
          const local = await localDb.forms.get(remote.id);
          // Se não existir localmente, ou se o remoto for mais novo
          if (!local || new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
            await localDb.forms.put({
              ...remote,
              syncStatus: 'synced'
            } as FormRecord);
          }
        }
      });
    }

  } catch (error) {
    console.error('Falha geral na sincronização:', error);
  }
}

// Configurar o listener de mudanças em tempo real (Realtime Supabase)
export function setupRealtimeSync(onUpdate: () => void) {
  const channel = supabase
    .channel('public:forms')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'forms' }, async (payload) => {
      // Quando algo muda no supabase, fazemos um sync e chamamos o callback que atualiza a UI
      await syncFormsWithSupabase();
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
