import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ugeekzmtavxcfrhtfrjq.supabase.co'
const supabaseKey = 'sb_publishable_psKiWylAChceBwiwjFHz-A_KsFI1efL'

export const supabase = createClient(supabaseUrl, supabaseKey)