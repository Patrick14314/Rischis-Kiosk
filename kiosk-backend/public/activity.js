function setupActivityTracking(userId) {
  if (typeof supabase === 'undefined') {
    console.error('Supabase client not initialized');
    return;
  }
  supabase.from('activity_log').insert({
    user_id: userId,
    action: 'shop_opened'
  }).then(({ error }) => {
    if (error) console.error('Aktivit\xe4ts-Tracking fehlgeschlagen', error);
    else console.log('Aktivit\xe4t erfasst');
  });
}
