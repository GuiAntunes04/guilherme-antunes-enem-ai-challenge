import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type ConfirmLeaveSimulationDialogProps = {
  open: boolean
  onStay: () => void
  onLeave: () => void
}

export function ConfirmLeaveSimulationDialog({
  open,
  onStay,
  onLeave,
}: ConfirmLeaveSimulationDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onStay}
      />
      <Card
        as="section"
        padding="lg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-simulation-title"
        aria-describedby="leave-simulation-desc"
        className="relative z-10 w-full max-w-md shadow-xl shadow-black/40"
      >
        <h2 id="leave-simulation-title" className="text-lg font-semibold text-foreground">
          Sair do simulado?
        </h2>
        <p id="leave-simulation-desc" className="mt-2 text-sm text-muted">
          Suas respostas nesta sessão ainda não foram enviadas. Se sair agora, você poderá
          retomar depois, mas o cronômetro continuará contando enquanto o simulado estiver
          em andamento.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onLeave}>
            Sair mesmo assim
          </Button>
          <Button variant="primary" onClick={onStay}>
            Continuar simulado
          </Button>
        </div>
      </Card>
    </div>
  )
}
