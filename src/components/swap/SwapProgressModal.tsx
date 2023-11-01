import Modal from 'components/Modal'
import React from 'react'

interface SwapProgressModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function SwapProgressModal({ isOpen, onDismiss }: SwapProgressModalProps) {
  return <Modal isOpen={isOpen} onDismiss={onDismiss}></Modal>
}
