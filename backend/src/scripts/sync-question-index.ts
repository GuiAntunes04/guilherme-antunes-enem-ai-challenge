import 'dotenv/config'
import { syncQuestionIndex } from '../services/question-index.js'

async function main() {
  console.log('Sincronizando índice de questões EnemHub → Supabase...')

  const result = await syncQuestionIndex()

  console.log(`Concluído: ${result.total} questões indexadas em ${result.pages} páginas.`)
}

main().catch((error) => {
  console.error('Falha na sincronização:', error instanceof Error ? error.message : error)
  process.exit(1)
})
