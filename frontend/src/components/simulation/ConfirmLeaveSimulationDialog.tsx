import { ConfirmDialog } from '../ui/ConfirmDialog'

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
  return (
    <ConfirmDialog
      open={open}
      title="Sair do simulado?"
      description={
        <>
          Suas respostas nesta sessão ainda não foram enviadas. Se sair agora, você poderá retomar
          depois, mas o cronômetro continuará contando enquanto o simulado estiver em andamento.
        </>
      }
      cancelLabel="Continuar simulado"
      confirmLabel="Sair mesmo assim"
      onCancel={onStay}
      onConfirm={onLeave}
      cancelIsPrimary
      confirmVariant="secondary"
      titleId="leave-simulation-title"
      descriptionId="leave-simulation-desc"
    />
  )
}
